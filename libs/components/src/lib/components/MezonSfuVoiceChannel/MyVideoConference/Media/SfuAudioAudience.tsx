import { useEffect, useRef, useState } from 'react';

export type SfuAudioAudienceState = 'joining' | 'connected' | 'reconnecting' | 'failed' | 'closed';

export interface SfuAudioAudienceProps {
	token: string;
	roomId: string;
	serverUrl: string;
	onRefreshToken: () => Promise<string>;
	onConnectionStateChange?: (state: SfuAudioAudienceState) => void;
	onError?: (error: Error) => void;
}

const reconnectDelay = (attempt: number) => Math.min(1000 * 2 ** Math.min(attempt, 4), 15000);

/** Receives the stream-channel speaker audio without microphone, camera, PTT, or video. */
export function SfuAudioAudience({ token, roomId, serverUrl, onRefreshToken, onConnectionStateChange, onError }: SfuAudioAudienceProps) {
	const [audioTracks, setAudioTracks] = useState<MediaStreamTrack[]>([]);
	const audioTracksRef = useRef<MediaStreamTrack[]>([]);
	const tokenRef = useRef(token);
	const disposedRef = useRef(false);
	const wsRef = useRef<WebSocket | null>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const reconnectTimerRef = useRef<number>();
	const reconnectAttemptRef = useRef(0);
	const negotiatingRef = useRef(false);
	const pendingOfferRef = useRef<{ sdp: string; offer_generation: number }>();
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

		const reportState = (state: SfuAudioAudienceState) => onConnectionStateChangeRef.current?.(state);
		const reportError = (message: string) => onErrorRef.current?.(new Error(message));
		let connecting = false;

		const closeTransport = () => {
			const ws = wsRef.current;
			wsRef.current = null;
			if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
			const pc = pcRef.current;
			pcRef.current = null;
			pc?.close();
			negotiatingRef.current = false;
			pendingOfferRef.current = undefined;
			audioTracksRef.current.forEach((track) => track.stop());
			audioTracksRef.current = [];
			setAudioTracks([]);
		};
		const scheduleReconnect = () => {
			if (disposedRef.current || connecting || reconnectTimerRef.current !== undefined) return;
			reconnectAttemptRef.current += 1;
			reportState('reconnecting');
			reconnectTimerRef.current = window.setTimeout(() => {
				reconnectTimerRef.current = undefined;
				void connect(true);
			}, reconnectDelay(reconnectAttemptRef.current));
		};

		const handleOffer = async (offer: { sdp: string; offer_generation: number }) => {
			if (disposedRef.current || !pcRef.current || !wsRef.current) return;
			if (negotiatingRef.current) {
				pendingOfferRef.current = offer;
				return;
			}
			negotiatingRef.current = true;
			try {
				const pc = pcRef.current;
				const ws = wsRef.current;
				if (!pc || !ws || ws.readyState !== WebSocket.OPEN) return;
				await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offer.sdp }));
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
				validateFullSdpLayout(offer.sdp, answer.sdp);
				await pc.setLocalDescription(answer);
				if (ws.readyState === WebSocket.OPEN && pc.localDescription?.sdp) {
					ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription.sdp, offer_generation: offer.offer_generation }));
				}
			} catch {
				reportError('SFU audio negotiation failed');
				scheduleReconnect();
			} finally {
				negotiatingRef.current = false;
				const pending = pendingOfferRef.current;
				pendingOfferRef.current = undefined;
				if (pending && !disposedRef.current) void handleOffer(pending);
			}
		};

		const connect = async (refreshToken: boolean) => {
			if (disposedRef.current || connecting) return;
			connecting = true;
			closeTransport();
			let nextToken = tokenRef.current;
			if (refreshToken) {
				try {
					nextToken = await onRefreshTokenRef.current();
					if (!nextToken) throw new Error('empty token');
					tokenRef.current = nextToken;
				} catch {
					connecting = false;
					reportError('Unable to refresh SFU audio token');
					reportState('failed');
					return;
				}
			}
			if (disposedRef.current) {
				connecting = false;
				return;
			}

			try {
				const pc = new RTCPeerConnection();
				pcRef.current = pc;
				pc.ontrack = ({ track }) => {
					if (track.kind !== 'audio') {
						track.stop();
						return;
					}
					setAudioTracks((current) => {
						const next = current.some((item) => item.id === track.id) ? current : [...current, track];
						audioTracksRef.current = next;
						return next;
					});
					track.onended = () =>
						setAudioTracks((current) => {
							const next = current.filter((item) => item.id !== track.id);
							audioTracksRef.current = next;
							return next;
						});
				};
				pc.onconnectionstatechange = () => {
					if (pc.connectionState === 'connected') {
						reconnectAttemptRef.current = 0;
						reportState('connected');
					} else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
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
					if (disposedRef.current || wsRef.current !== ws) return;
					ws.send(JSON.stringify({ type: 'join', room: roomId, token: nextToken, role: 'audience' }));
				};
				ws.onmessage = ({ data }) => {
					if (disposedRef.current || wsRef.current !== ws) return;
					let message: { type?: string; sdp?: string; offer_generation?: number; message?: string };
					try {
						message = JSON.parse(data) as typeof message;
					} catch {
						return;
					}
					if (message.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
					if (message.type === 'offer' && message.sdp && message.offer_generation != null) {
						void handleOffer({ sdp: message.sdp, offer_generation: message.offer_generation });
					}
					if (message.type === 'error') {
						reportError(message.message === 'invalid_token' ? 'SFU audio token rejected' : 'SFU audio signaling failed');
						scheduleReconnect();
					}
				};
				ws.onerror = () => reportError('SFU audio signaling failed');
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
			disposedRef.current = true;
			if (reconnectTimerRef.current !== undefined) window.clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = undefined;
			closeTransport();
			setAudioTracks([]);
			reportState('closed');
		};
	}, [roomId, serverUrl, token]);

	return (
		<div className="hidden" aria-hidden="true">
			{audioTracks.map((track) => (
				<SfuAudioElement key={track.id} track={track} />
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

function SfuAudioElement({ track }: { track: MediaStreamTrack }) {
	const ref = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.srcObject = new MediaStream([track]);
		void element.play().catch(() => undefined);
		return () => {
			element.pause();
			element.srcObject = null;
		};
	}, [track]);
	return <audio ref={ref} autoPlay playsInline />;
}
