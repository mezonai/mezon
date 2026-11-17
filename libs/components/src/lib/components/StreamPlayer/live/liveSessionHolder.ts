import type { LiveSession } from './liveSession';

export interface PendingLiveCapture {
	clanId: string;
	channelId: string;
	screen: MediaStream | null;
	camera: MediaStream | null;
	mic: MediaStream | null;
	audioContext: AudioContext;
	systemAudioOn: boolean;
}

let currentSession: LiveSession | null = null;
let pendingCapture: PendingLiveCapture | null = null;
const listeners = new Set<() => void>();

export function getLiveSession(): LiveSession | null {
	return currentSession;
}

export function setLiveSession(session: LiveSession | null): void {
	currentSession = session;
	listeners.forEach((listener) => listener());
}

export function subscribeLiveSession(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function setPendingLiveCapture(capture: PendingLiveCapture | null): void {
	pendingCapture = capture;
}

export function takePendingLiveCapture(): PendingLiveCapture | null {
	const next = pendingCapture;
	pendingCapture = null;
	return next;
}
