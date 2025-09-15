import { useRoomContext } from '@livekit/components-react';
import { DataPacket_Kind, Participant, RoomEvent } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

export type IncomingTranscriptEntry = {
	participantIdentity: string;
	participantName: string;
	seq: number;
	isFinal: boolean;
	language?: string | null;
	text: string;
	timestamp: number; // ms
};

export type TranscriptListItem = {
	id: string;
	timestamp: string;
	speaker?: string;
	text: string;
};

type ActiveUtterance = {
	seq: number;
	text: string;
	startedAt: number;
	participantIdentity: string;
	participantName: string;
};

function formatTime(ms: number): string {
	const d = new Date(ms);
	const h = d.getHours().toString().padStart(2, '0');
	const m = d.getMinutes().toString().padStart(2, '0');
	const s = d.getSeconds().toString().padStart(2, '0');
	return `${h}:${m}:${s}`;
}

function normalizeText(text: string): string {
	return text.trim().toLowerCase();
}

export function useTranscript(maxItems = 500) {
	const room = useRoomContext();
	const [items, setItems] = useState<TranscriptListItem[]>([]);
	const activeMetaByParticipant = useRef<Map<string, ActiveUtterance>>(new Map());
	const activeIndexByParticipant = useRef<Map<string, number>>(new Map());
	const recentTextWindow = useRef<Map<string, { pid: string; ts: number }>>(new Map());
	const DEDUP_WINDOW_MS = 3000;

	const appendItemAndTrack = (participantId: string, entry: ActiveUtterance, finalizeImmediately: boolean) => {
		setItems((prev) => {
			const newIndex = prev.length;
			let next: TranscriptListItem[] = [
				...prev,
				{
					id: `${entry.participantIdentity}-${entry.seq}-${entry.startedAt}`,
					timestamp: formatTime(entry.startedAt),
					speaker: entry.participantName,
					text: entry.text
				}
			];
			if (!finalizeImmediately) {
				activeMetaByParticipant.current.set(participantId, entry);
				activeIndexByParticipant.current.set(participantId, newIndex);
			} else {
				activeMetaByParticipant.current.delete(participantId);
				activeIndexByParticipant.current.delete(participantId);
			}
			while (next.length > maxItems) {
				const removeIdx = 0;
				const isActive = Array.from(activeIndexByParticipant.current.values()).includes(removeIdx);
				if (isActive) break;
				next = next.slice(1);
				activeIndexByParticipant.current.forEach((idx, pid) => {
					activeIndexByParticipant.current.set(pid, idx - 1);
				});
			}
			return next;
		});
	};

	useEffect(() => {
		if (!room) return;

		const handleData = (payload: Uint8Array, participant?: Participant, _kind?: DataPacket_Kind, _topic?: string) => {
			try {
				if (_topic !== 'transcript') return;
				const json = new TextDecoder().decode(payload);
				const data = JSON.parse(json) as { type?: string; entry?: IncomingTranscriptEntry };
				if (data?.type !== 'transcript' || !data.entry) return;

				const entry = data.entry;
				const participantKey = entry.participantIdentity;
				const now = Date.now();
				const normalizedText = normalizeText(entry.text);
				const prev = recentTextWindow.current.get(normalizedText);
				if (prev && prev.pid !== participantKey && now - prev.ts < DEDUP_WINDOW_MS) {
					return;
				}
				recentTextWindow.current.set(normalizedText, { pid: participantKey, ts: now });

				const existingMeta = activeMetaByParticipant.current.get(participantKey);
				const existingIndex = activeIndexByParticipant.current.get(participantKey);

				if (existingMeta !== undefined && existingIndex !== undefined) {
					setItems((prev) => {
						if (existingIndex < 0 || existingIndex >= prev.length) return prev;
						const copy = prev.slice();
						copy[existingIndex] = {
							...copy[existingIndex],
							text: entry.text,
							speaker: entry.participantName
						};
						return copy;
					});
					existingMeta.text = entry.text;
					existingMeta.participantName = entry.participantName;

					if (entry.isFinal) {
						activeMetaByParticipant.current.delete(participantKey);
						activeIndexByParticipant.current.delete(participantKey);
					}
				} else {
					const newActive: ActiveUtterance = {
						seq: entry.seq,
						text: entry.text,
						startedAt: Date.now(),
						participantIdentity: entry.participantIdentity,
						participantName: entry.participantName
					};
					appendItemAndTrack(participantKey, newActive, entry.isFinal);
				}
			} catch (error) {
				// ignore malformed payloads
			}
		};

		room.on(RoomEvent.DataReceived, handleData);
		return () => {
			room.off(RoomEvent.DataReceived, handleData);
		};
	}, [room]);

	return useMemo(() => ({ items }), [items]);
}
