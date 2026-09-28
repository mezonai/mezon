import { useSyncExternalStore } from 'react';

export type MediaDevice = 'microphone' | 'camera';
export type MediaPermissionState = 'granted' | 'denied' | 'prompt';
export type MediaPermissionPrompt =
	| { kind: 'request'; device: MediaDevice; requesting: boolean }
	| { kind: 'blocked'; device: MediaDevice; bySystem: boolean };
export type MediaAccessResult = 'granted' | 'refused' | 'unavailable';

interface MediaPermissionSnapshot {
	microphone: MediaPermissionState | null;
	camera: MediaPermissionState | null;
	prompt: MediaPermissionPrompt | null;
}

const DEVICES: MediaDevice[] = ['microphone', 'camera'];
// A refusal quicker than this cannot be a person answering the browser's prompt.
const PROMPT_ANSWER_MIN_MS = 300;
const listeners = new Set<() => void>();
const blockedBySystem: Record<MediaDevice, boolean> = { microphone: false, camera: false };
const capturedThisSession: Record<MediaDevice, boolean> = { microphone: false, camera: false };
// Held so their change listeners are not garbage collected.
const watchedStatuses: PermissionStatus[] = [];
let snapshot: MediaPermissionSnapshot = { microphone: null, camera: null, prompt: null };
let onGranted: (() => void) | null = null;
let watching = false;

const constraintsFor = (device: MediaDevice): MediaStreamConstraints => (device === 'microphone' ? { audio: true } : { video: true });

const setSnapshot = (next: Partial<MediaPermissionSnapshot>) => {
	snapshot = { ...snapshot, ...next };
	listeners.forEach((listener) => listener());
};

const effectiveState = (device: MediaDevice, browserState: PermissionState): MediaPermissionState => {
	if (browserState === 'granted') return blockedBySystem[device] ? 'denied' : 'granted';
	// A one-time grant (Firefox without "Remember", Safari) still queries as 'prompt'.
	if (browserState === 'prompt' && capturedThisSession[device]) return 'granted';
	return browserState;
};

const queryBrowserPermission = async (device: MediaDevice): Promise<PermissionState | null> => {
	if (typeof navigator === 'undefined' || !navigator.permissions?.query) return null;
	try {
		const status = await navigator.permissions.query({ name: device as PermissionName });
		return status.state;
	} catch {
		return null;
	}
};

const apply = (device: MediaDevice, state: MediaPermissionState) => {
	const previous = snapshot[device];
	const { prompt } = snapshot;
	let nextPrompt = prompt;
	if (prompt?.device === device) {
		if (prompt.kind === 'request' && state === 'granted') {
			nextPrompt = null;
			const action = onGranted;
			onGranted = null;
			if (action) setTimeout(action);
		} else if (prompt.kind === 'request' && state === 'denied') {
			onGranted = null;
			nextPrompt = { kind: 'blocked', device, bySystem: blockedBySystem[device] };
		} else if (prompt.kind === 'blocked' && state === 'granted') {
			nextPrompt = null;
		}
	}
	if (previous !== state || nextPrompt !== prompt) {
		setSnapshot({ [device]: state, prompt: nextPrompt });
	}
};

const refresh = async (device: MediaDevice) => {
	const browserState = await queryBrowserPermission(device);
	if (browserState) apply(device, effectiveState(device, browserState));
};

export const refreshMediaPermissions = async () => {
	await Promise.all(DEVICES.map(refresh));
};

const watch = () => {
	if (watching || typeof window === 'undefined') return;
	watching = true;
	window.addEventListener('focus', () => void refreshMediaPermissions());
	if (!navigator.permissions?.query) return;
	DEVICES.forEach((device) => {
		navigator.permissions
			.query({ name: device as PermissionName })
			.then((status) => {
				watchedStatuses.push(status);
				apply(device, effectiveState(device, status.state));
				status.addEventListener('change', () => apply(device, effectiveState(device, status.state)));
			})
			.catch(() => undefined);
	});
};

const subscribe = (listener: () => void) => {
	watch();
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const isPermissionRefusal = (error: unknown) => {
	const name = (error as DOMException | undefined)?.name;
	return name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError';
};

export const reportMediaAccessGranted = (device: MediaDevice) => {
	blockedBySystem[device] = false;
	capturedThisSession[device] = true;
	apply(device, 'granted');
};

/**
 * Records a refused `getUserMedia` and opens the blocked popup for it. Returns false for failures
 * that are not a permission refusal (no device, device busy), which callers report themselves.
 */
export const reportMediaAccessError = (device: MediaDevice, error: unknown, requestedAt?: number): boolean => {
	if (!isPermissionRefusal(error)) return false;
	capturedThisSession[device] = false;
	const message = (error as Error | undefined)?.message ?? '';
	const answeredAfterMs = requestedAt === undefined ? undefined : Date.now() - requestedAt;
	void queryBrowserPermission(device).then((browserState) => {
		// The site is allowed but the browser itself is not: the OS privacy settings refused it.
		const bySystem = browserState === 'granted' || /system/i.test(message);
		// Still 'prompt' means the user closed the browser's prompt: nothing is blocked. An instant refusal
		// is the browser blocking without asking (Firefox's temporary block), which needs the unblock steps.
		if (browserState === 'prompt' && !bySystem && (answeredAfterMs === undefined || answeredAfterMs >= PROMPT_ANSWER_MIN_MS)) {
			const { prompt } = snapshot;
			if (prompt?.kind === 'request' && prompt.device === device) setSnapshot({ prompt: { ...prompt, requesting: false } });
			return;
		}
		blockedBySystem[device] = bySystem;
		const { prompt } = snapshot;
		if (prompt?.device === device) onGranted = null;
		setSnapshot({
			[device]: 'denied',
			prompt: prompt && prompt.device !== device ? prompt : { kind: 'blocked', device, bySystem: blockedBySystem[device] }
		});
	});
	return true;
};

const acquire = async (device: MediaDevice): Promise<MediaAccessResult> => {
	const requestedAt = Date.now();
	try {
		const stream = await navigator.mediaDevices.getUserMedia(constraintsFor(device));
		stream.getTracks().forEach((track) => track.stop());
		reportMediaAccessGranted(device);
		return 'granted';
	} catch (error) {
		return reportMediaAccessError(device, error, requestedAt) ? 'refused' : 'unavailable';
	}
};

/**
 * Resolves true when the device can be used right away. Otherwise opens the request popup (not asked
 * yet) or the blocked popup (refused), and runs `action` once the request popup ends in a grant.
 */
export const ensureMediaPermission = async (device: MediaDevice, action?: () => void): Promise<boolean> => {
	watch();
	const browserState = await queryBrowserPermission(device);
	// Already asking: keep that popup and its pending action.
	if (snapshot.prompt) return false;
	const state: MediaPermissionState = browserState ? effectiveState(device, browserState) : snapshot[device] === 'granted' ? 'granted' : 'prompt';
	if (browserState === 'granted' && blockedBySystem[device]) {
		// Only a capture attempt tells whether the OS still blocks the browser.
		const result = await acquire(device);
		if (result === 'unavailable') {
			// No longer refused: let the caller run into its own device error.
			blockedBySystem[device] = false;
			apply(device, 'granted');
		}
		return result !== 'refused';
	}
	if (state === 'granted') {
		apply(device, 'granted');
		return true;
	}
	onGranted = state === 'prompt' ? (action ?? null) : null;
	setSnapshot({
		[device]: state,
		prompt: state === 'prompt' ? { kind: 'request', device, requesting: false } : { kind: 'blocked', device, bySystem: false }
	});
	return false;
};

/** The request popup's Allow button: raises the browser's own permission prompt. */
export const allowMediaPermissionRequest = async (): Promise<MediaAccessResult | undefined> => {
	const { prompt } = snapshot;
	if (prompt?.kind !== 'request' || prompt.requesting) return undefined;
	setSnapshot({ prompt: { ...prompt, requesting: true } });
	const result = await acquire(prompt.device);
	const current = snapshot.prompt;
	if (result === 'unavailable' && current?.kind === 'request' && current.device === prompt.device) {
		onGranted = null;
		setSnapshot({ prompt: null });
	}
	return result;
};

export const dismissMediaPermissionPrompt = () => {
	onGranted = null;
	if (snapshot.prompt) setSnapshot({ prompt: null });
};

export function useMediaPermissionPrompt() {
	return useSyncExternalStore(subscribe, () => snapshot.prompt);
}

export function useMediaPermissions() {
	const microphonePermissionState = useSyncExternalStore(subscribe, () => snapshot.microphone);
	const cameraPermissionState = useSyncExternalStore(subscribe, () => snapshot.camera);

	return {
		hasCameraAccess: cameraPermissionState === null ? null : cameraPermissionState === 'granted',
		hasMicrophoneAccess: microphonePermissionState === null ? null : microphonePermissionState === 'granted',
		cameraPermissionState,
		microphonePermissionState,
		refreshPermissions: refreshMediaPermissions
	};
}
