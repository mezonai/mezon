import { useEffect, useRef, useState } from 'react';
import type { SfuSignalMessage } from '../../types';
import { canReactivateMid, getDepartedMids, getMsidOccupantsByMidFromSdp, isReceivingRemoteTrack, type RetiredSource } from '../remoteMediaLifecycle';
import { SfuAudioTrack } from './SfuAudioTrack';

export type SfuAudioAudienceState = 'joining' | 'connected' | 'reconnecting' | 'failed' | 'closed';

export interface SfuAudioAudienceProps {
	token: string;
	roomId: string;
	serverUrl: string;
	volume?: number;
	muted?: boolean;
	onRefreshToken: () => Promise<string>;
	onConnectionStateChange?: (state: SfuAudioAudienceState) => void;
	onError?: (error: Error) => void;
}

const reconnectDelay = (attempt: number) => Math.min(1000 * 2 ** Math.min(attempt, 4), 15000);
const MAX_RECONNECT_ATTEMPTS = 40;
const HEALTHY_CONNECTION_RESET_MS = 30_000;

const applyReceiverJitterTarget = (receiver: RTCRtpReceiver) => {
	const withHint = receiver as RTCRtpReceiver & { jitterBufferTarget?: number; playoutDelayHint?: number };
	if (typeof withHint.jitterBufferTarget === 'number' || 'jitterBufferTarget' in withHint) {
		try {
			withHint.jitterBufferTarget = 80;
		} catch {
			// Browser may reject the assignment.
		}
	}
	if (typeof withHint.playoutDelayHint === 'number' || 'playoutDelayHint' in withHint) {
		try {
			withHint.playoutDelayHint = 0.08;
		} catch {
			// Browser may reject the assignment.
		}
	}
};

/** Receives the stream-channel speaker audio without microphone, camera, PTT, or video. */
export function SfuAudioAudience({
	token,
	roomId,
	serverUrl,
	volume = 1,
	muted = false,
	onRefreshToken,
	onConnectionStateChange,
	onError
}: SfuAudioAudienceProps) {
	const [audioTracks, setAudioTracks] = useState<MediaStreamTrack[]>([]);
	const audioTracksRef = useRef<MediaStreamTrack[]>([]);
	const tracksByMidRef = useRef(new Map<string, MediaStreamTrack>());
	const tokenRef = useRef(token);
	const disposedRef = useRef(false);
	const wsRef = useRef<WebSocket | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const reconnectTimerRef = useRef<number>();
	const reconnectAttemptRef = useRef(0);
	const stableConnectionTimerRef = useRef<number>();
	const negotiatingRef = useRef(false);
	const pendingOfferRef = useRef<{ sdp: string; offer_generation: number }>();
	const lastOfferGenerationRef = useRef(-1);
	const onRefreshTokenRef = useRef(onRefreshToken);
	const onConnectionStateChangeRef = useRef(onConnectionStateChange);
	const onErrorRef = useRef(onError);

	tokenRef.current = token;
	onRefreshTokenRef.current = onRefreshToken;
	onConnectionStateChangeRef.current = onConnectionStateChange;
	onErrorRef.current = onError;

	useEffect(() => {
		disposedRef.current = false;
		tokenRef.current = token;
		reconnectAttemptRef.current = 0;
		lastOfferGenerationRef.current = -1;

		const reportState = (state: SfuAudioAudienceState) => onConnectionStateChangeRef.current?.(state);
		const reportError = (message: string) => onErrorRef.current?.(new Error(message));
		let connecting = false;
		let closingIntentionally = false;
		let disposed = false;
		const owners = new Map<string, string>();
		const users = new Map<string, string>();
		const retired = new Map<string, RetiredSource>();
		const syncAudio = (pc: RTCPeerConnection) => {
			if (disposed || pcRef.current !== pc || negotiatingRef.current) return;
			const nextByMid = new Map<string, MediaStreamTrack>();
			for (const transceiver of pc.getTransceivers()) {
				const mid = transceiver.mid;
				if (!mid || Number(mid) < 3 || retired.has(mid) || !isReceivingRemoteTrack(transceiver)) continue;
				if (transceiver.receiver.track.kind !== 'audio') continue;
				applyReceiverJitterTarget(transceiver.receiver);
				nextByMid.set(mid, transceiver.receiver.track);
			}
			tracksByMidRef.current = nextByMid;
			const next = [...nextByMid.values()];
			audioTracksRef.current = next;
			setAudioTracks((current) => (current.length === next.length && current.every((track, index) => track === next[index]) ? current : next));
		};
		const syncTimer = window.setInterval(() => {
			if (pcRef.current) syncAudio(pcRef.current);
		}, 5000);

		const closeTransport = () => {
			closingIntentionally = true;
			const ws = wsRef.current;
			wsRef.current = null;
			if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
			const pc = pcRef.current;
			pcRef.current = null;
			pc?.close();
			if (stableConnectionTimerRef.current !== undefined) window.clearTimeout(stableConnectionTimerRef.current);
			stableConnectionTimerRef.current = undefined;
			negotiatingRef.current = false;
			pendingOfferRef.current = undefined;
			lastOfferGenerationRef.current = -1;
			audioTracksRef.current.forEach((track) => track.stop());
			audioTracksRef.current = [];
			tracksByMidRef.current.forEach((track) => track.stop());
			tracksByMidRef.current.clear();
			owners.clear();
			users.clear();
			retired.clear();
			setAudioTracks([]);
			closingIntentionally = false;
		};
		const scheduleReconnect = () => {
			if (disposed || disposedRef.current || connecting || closingIntentionally || reconnectTimerRef.current !== undefined) return;
			if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
				reportError('SFU audio reconnect limit reached');
				reportState('failed');
				closeTransport();
				return;
			}
			reconnectAttemptRef.current += 1;
			reportState('reconnecting');
			reconnectTimerRef.current = window.setTimeout(() => {
				reconnectTimerRef.current = undefined;
				void connect(true);
			}, reconnectDelay(reconnectAttemptRef.current));
		};

		const handleOffer = async (offer: { sdp: string; offer_generation: number }) => {
			if (disposed || disposedRef.current || !pcRef.current || !wsRef.current) return;
			if (offer.offer_generation <= lastOfferGenerationRef.current) return;
			if (negotiatingRef.current) {
				if (!pendingOfferRef.current || offer.offer_generation > pendingOfferRef.current.offer_generation) {
					pendingOfferRef.current = offer;
				}
				return;
			}
			const pc = pcRef.current;
			const ws = wsRef.current;
			negotiatingRef.current = true;
			try {
				if (!pc || !ws || ws.readyState !== WebSocket.OPEN) return;
				await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offer.sdp }));
				if (disposed || disposedRef.current || pcRef.current !== pc || wsRef.current !== ws) return;
				// The SFU keeps its complete audio/video/screen SDP layout. This
				// audience participates in that layout but negotiates no video media.
				const offeredKinds = offer.sdp
					.split(/\r?\nm=/)
					.slice(1)
					.map((section) => section.split(/\s+/, 1)[0]);
				const transceivers = pc.getTransceivers();
				if (transceivers.length !== offeredKinds.length) throw new Error('SFU transceiver count changed');
				transceivers.forEach((transceiver, index) => {
					transceiver.direction = offeredKinds[index] === 'video' ? 'inactive' : 'recvonly';
				});
				const answer = await pc.createAnswer();
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				validateFullSdpLayout(offer.sdp, answer.sdp);
				await pc.setLocalDescription(answer);
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				// An existing receiver can be reused without another ontrack event.
				for (const [mid, occupant] of getMsidOccupantsByMidFromSdp(offer.sdp)) {
					if (Number(mid) < 3 || !canReactivateMid(retired.get(mid), occupant, owners.get(mid))) continue;
					retired.delete(mid);
					users.set(mid, occupant.userId);
					if (occupant.peerId) owners.set(mid, occupant.peerId);
				}
				if (ws.readyState !== WebSocket.OPEN || !pc.localDescription?.sdp) return;
				ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription.sdp, offer_generation: offer.offer_generation }));
				lastOfferGenerationRef.current = offer.offer_generation;
			} catch {
				if (disposed || pcRef.current !== pc || wsRef.current !== ws) return;
				reportError('SFU audio negotiation failed');
				scheduleReconnect();
			} finally {
				if (!disposed && pcRef.current === pc && wsRef.current === ws) {
					negotiatingRef.current = false;
					if (pc) syncAudio(pc);
					const pending = pendingOfferRef.current;
					pendingOfferRef.current = undefined;
					if (pending) void handleOffer(pending);
				}
			}
		};

		const connect = async (refreshToken: boolean) => {
			if (disposed || disposedRef.current || connecting) return;
			connecting = true;
			closeTransport();
			let nextToken = tokenRef.current;
			if (refreshToken) {
				try {
					nextToken = await onRefreshTokenRef.current();
					if (disposed) return;
					if (!nextToken) throw new Error('empty token');
					tokenRef.current = nextToken;
				} catch {
					if (disposed) return;
					connecting = false;
					reportError('Unable to refresh SFU audio token');
					scheduleReconnect();
					return;
				}
			}
			if (disposed || disposedRef.current) {
				connecting = false;
				return;
			}

			try {
				const pc = new RTCPeerConnection({ iceServers: [] });
				pcRef.current = pc;
				pc.ontrack = ({ track }) => {
					const refresh = () => syncAudio(pc);
					refresh();
					track.addEventListener('ended', refresh);
					track.addEventListener('unmute', refresh);
					track.addEventListener('mute', refresh);
				};
				pc.onconnectionstatechange = () => {
					if (pcRef.current !== pc) return;
					if (pc.connectionState === 'connected') {
						if (stableConnectionTimerRef.current !== undefined) window.clearTimeout(stableConnectionTimerRef.current);
						stableConnectionTimerRef.current = window.setTimeout(() => {
							stableConnectionTimerRef.current = undefined;
							if (pcRef.current === pc && pc.connectionState === 'connected') reconnectAttemptRef.current = 0;
						}, HEALTHY_CONNECTION_RESET_MS);
						reportState('connected');
					} else if (pc.connectionState === 'failed') {
						scheduleReconnect();
					}
				};

				const secureServerUrl =
					window.location.protocol === 'https:' && serverUrl.startsWith('ws://') ? `wss://${serverUrl.slice(5)}` : serverUrl;
				const wsUrl = new URL(secureServerUrl);
				wsUrl.searchParams.set('access_token', nextToken);
				const ws = new WebSocket(wsUrl.toString());
				wsRef.current = ws;
				reportState('joining');
				ws.onopen = () => {
					if (disposed || disposedRef.current || wsRef.current !== ws) return;
					if (ws.readyState === WebSocket.OPEN) {
						const joinMessage = { type: 'join', room: roomId, token: nextToken, role: 'audience' };
						ws.send(JSON.stringify(joinMessage));
					}
				};
				ws.onmessage = ({ data }) => {
					if (disposed || disposedRef.current || wsRef.current !== ws) return;
					let message: SfuSignalMessage;
					try {
						message = JSON.parse(data) as typeof message;
					} catch {
						return;
					}
					if (message.type === 'ping' && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'pong' }));
					if (message.type === 'offer' && message.sdp && message.offer_generation != null) {
						void handleOffer({ sdp: message.sdp, offer_generation: message.offer_generation });
					}
					const peers =
						message.type === 'room_snapshot'
							? message.members
							: (message.type === 'peer_joined' || message.type === 'peer_updated') && message.peer
								? [message.peer]
								: undefined;
					for (const peer of peers || []) {
						for (const mid of [peer.mid_audio, peer.mid_video, peer.mid_screen]
							.filter((mid) => mid != null && Number(mid) >= 3)
							.map(String)) {
							owners.set(mid, String(peer.peer_id));
							if (peer.user_id) users.set(mid, peer.user_id);
						}
					}
					if (message.type === 'peer_left') {
						const peerId = message.peer_id == null ? undefined : String(message.peer_id);
						for (const mid of getDepartedMids(
							peerId,
							message.user_id,
							[message.mid_audio, message.mid_video, message.mid_screen],
							owners,
							users
						)) {
							retired.set(mid, { peerId, userId: users.get(mid) || message.user_id });
							owners.delete(mid);
							users.delete(mid);
							tracksByMidRef.current.delete(mid);
						}
						const remaining = [...tracksByMidRef.current.values()];
						audioTracksRef.current = remaining;
						setAudioTracks(remaining);
					}
					if (message.type === 'error') {
						if (message.message === 'stale_offer_generation' || message.message === 'future_offer_generation') return;
						reportError(message.message === 'invalid_token' ? 'SFU audio token rejected' : 'SFU audio signaling failed');
						scheduleReconnect();
					}
				};
				ws.onerror = () => {
					if (disposed || wsRef.current !== ws) return;
					reportError('SFU audio signaling failed');
					if (wsRef.current === ws && ws.readyState !== WebSocket.CLOSED) ws.close();
				};
				ws.onclose = () => {
					if (wsRef.current === ws) {
						wsRef.current = null;
						scheduleReconnect();
					}
				};
				connecting = false;
			} catch {
				connecting = false;
				reportError('Unable to create SFU audio transport');
				scheduleReconnect();
			}
		};

		void connect(false);
		return () => {
			disposed = true;
			window.clearInterval(syncTimer);
			disposedRef.current = true;
			if (reconnectTimerRef.current !== undefined) window.clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = undefined;
			closeTransport();
			setAudioTracks([]);
			reportState('closed');
		};
	}, [roomId, serverUrl]);

	return (
		<div className="hidden" aria-hidden="true">
			{audioTracks.map((track) => (
				<SfuAudioTrack key={track.id} track={track} volume={volume} muted={muted} />
			))}
		</div>
	);
}

function validateFullSdpLayout(offerSdp: string, answerSdp?: string) {
	if (!answerSdp) throw new Error('SFU returned an empty SDP answer');
	const sections = (sdp: string) =>
		sdp
			.split(/\r?\nm=/)
			.slice(1)
			.map((section) => {
				const lines = `m=${section}`.split(/\r?\n/);
				return {
					media: lines[0].split(/\s+/, 1)[0],
					mid: lines.find((line) => line.startsWith('a=mid:'))?.slice(6),
					lines
				};
			});
	const offerSections = sections(offerSdp);
	const answerSections = sections(answerSdp);
	if (
		offerSections.length !== answerSections.length ||
		offerSections.some((section, index) => section.media !== answerSections[index]?.media || section.mid !== answerSections[index]?.mid)
	) {
		throw new Error('SFU SDP answer changed the media section layout');
	}
	if (answerSections.some((section, index) => offerSections[index]?.media === 'm=video' && !section.lines.includes('a=inactive'))) {
		throw new Error('SFU SDP answer activated a video media section');
	}
}
