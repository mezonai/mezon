import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveCommentItem } from './liveCommentSender';

export const MAX_LIVE_COMMENTS = 4;
export const LIVE_COMMENT_TTL_MS = 8000;

export type LiveCommentDraftItem = Omit<LiveCommentItem, 'id' | 'timestamp'> & {
	id?: string;
	timestamp?: number;
};

export const useLiveCommentQueue = () => {
	const [comments, setComments] = useState<LiveCommentItem[]>([]);
	const [hidden, setHidden] = useState(false);
	const [hasUnseen, setHasUnseen] = useState(false);
	const hiddenRef = useRef(false);
	const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const seqRef = useRef(0);

	const add = useCallback((input: LiveCommentDraftItem) => {
		const id = input.id || `live-comment-${Date.now()}-${++seqRef.current}`;
		const item: LiveCommentItem = {
			id,
			senderId: input.senderId,
			name: input.name,
			avatar: input.avatar,
			content: input.content,
			timestamp: input.timestamp ?? Date.now()
		};

		const existingTimer = timersRef.current.get(id);
		if (existingTimer !== undefined) {
			clearTimeout(existingTimer);
			timersRef.current.delete(id);
		}

		setComments((prev) => {
			const next = [...prev.filter((existing) => existing.id !== item.id), item];
			if (next.length <= MAX_LIVE_COMMENTS) return next;
			const dropped = next.slice(0, next.length - MAX_LIVE_COMMENTS);
			for (const oldItem of dropped) {
				const oldTimer = timersRef.current.get(oldItem.id);
				if (oldTimer !== undefined) {
					clearTimeout(oldTimer);
					timersRef.current.delete(oldItem.id);
				}
			}
			return next.slice(-MAX_LIVE_COMMENTS);
		});

		const timer = setTimeout(() => {
			timersRef.current.delete(item.id);
			setComments((prev) => prev.filter((existing) => existing.id !== item.id));
		}, LIVE_COMMENT_TTL_MS);
		timersRef.current.set(item.id, timer);

		if (hiddenRef.current) {
			setHasUnseen(true);
		}
	}, []);

	const hide = useCallback(() => {
		hiddenRef.current = true;
		setHidden(true);
	}, []);

	const show = useCallback(() => {
		hiddenRef.current = false;
		setHidden(false);
		setHasUnseen(false);
	}, []);

	const toggle = useCallback(() => {
		const nextHidden = !hiddenRef.current;
		hiddenRef.current = nextHidden;
		setHidden(nextHidden);
		if (!nextHidden) {
			setHasUnseen(false);
		}
	}, []);

	const reset = useCallback(() => {
		for (const timer of timersRef.current.values()) {
			clearTimeout(timer);
		}
		timersRef.current.clear();
		hiddenRef.current = false;
		setComments([]);
		setHidden(false);
		setHasUnseen(false);
	}, []);

	useEffect(() => {
		const timers = timersRef.current;
		return () => {
			for (const timer of timers.values()) {
				clearTimeout(timer);
			}
			timers.clear();
		};
	}, []);

	return {
		comments,
		hidden,
		hasUnseen,
		add,
		hide,
		show,
		toggle,
		reset
	};
};
