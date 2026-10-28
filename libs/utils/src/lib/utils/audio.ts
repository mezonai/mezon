export const getBlobDuration = async (blob: string | Blob): Promise<number> => {
	const videoElement = document.createElement('video');

	const durationPromise = new Promise<number>((resolve, reject) => {
		videoElement.addEventListener('loadedmetadata', () => {
			if (videoElement.duration === Infinity) {
				videoElement.currentTime = Number.MAX_SAFE_INTEGER;
				videoElement.ontimeupdate = () => {
					videoElement.ontimeupdate = null;
					resolve(videoElement.duration);
					videoElement.currentTime = 0;
				};
			} else {
				resolve(videoElement.duration);
			}
		});

		videoElement.onerror = (errorEvent) => {
			const eventAsEvent = errorEvent as Event;
			reject((eventAsEvent.target as HTMLVideoElement).error);
		};
	});

	const isStringBlob = typeof blob === 'string' || blob instanceof String;
	const blobUrl = isStringBlob ? (blob as string) : URL.createObjectURL(blob as Blob);
	videoElement.src = blobUrl;

	try {
		const duration = await durationPromise;
		if (!isStringBlob) {
			URL.revokeObjectURL(blobUrl);
		}
		videoElement.remove();
		return duration;
	} catch (error) {
		if (!isStringBlob) {
			URL.revokeObjectURL(blobUrl);
		}
		videoElement.remove();
		throw error;
	}
};

export const blobToFile = (blob: Blob): File => {
	const timestamp = new Date().getTime();
	return new File([blob], `audio-${timestamp}.ogg`, { type: 'audio/mp3' });
};

export type MezonAudioCaptureOptions = MediaTrackConstraints & {
	voiceIsolation?: ConstrainBoolean;
	googEchoCancellation?: boolean;
	googAutoGainControl?: boolean;
	googNoiseSuppression?: boolean;
	googHighpassFilter?: boolean;
};

// Keep the current UI toggle, but always use WebRTC's built-in audio processing for capture.
export const getNoiseSuppressionAudioCaptureOptions = (_enabled: boolean): MezonAudioCaptureOptions => ({
	echoCancellation: true,
	noiseSuppression: true,
	autoGainControl: true,
	voiceIsolation: true,
	googEchoCancellation: true,
	googAutoGainControl: true,
	googNoiseSuppression: true,
	googHighpassFilter: true,
	sampleRate: 48000,
	channelCount: 1
});

export type MezonNsAudioCaptureOptions = MezonAudioCaptureOptions & { googNoiseSuppression?: boolean; googAutoGainControl?: boolean };

// Mezon-NS replaces native noise suppression; keep browser AGC so mic loudness
// remains consistent when the user toggles the filter.
export const getMezonNsAudioCaptureOptions = (): MezonNsAudioCaptureOptions => ({
	channelCount: 1,
	echoCancellation: { exact: true },
	noiseSuppression: { exact: false },
	voiceIsolation: { exact: false },
	autoGainControl: true,
	googNoiseSuppression: false,
	googAutoGainControl: true
});

const PREFERRED_INPUT_DEVICE_STORAGE_KEY = 'mezon.voice.inputDeviceId';

// Microphone shared by voice settings, voice rooms, DM calls and the meeting pre-join
export const getPreferredInputDeviceId = (): string => {
	try {
		return localStorage.getItem(PREFERRED_INPUT_DEVICE_STORAGE_KEY) || 'default';
	} catch {
		return 'default';
	}
};

export const setPreferredInputDeviceId = (deviceId: string) => {
	try {
		localStorage.setItem(PREFERRED_INPUT_DEVICE_STORAGE_KEY, deviceId);
	} catch {
		// Storage unavailable: the choice only lasts for this page
	}
};

export const PREFERRED_OUTPUT_DEVICE_STORAGE_KEY = 'mezon.voice.outputDeviceId';

export const OUTPUT_DEVICE_CHANGE_EVENT = 'mezon:outputDeviceChange';

export function normalizePreferredOutputDeviceId(deviceId: string | null | undefined): string {
	if (!deviceId) return 'default';
	return deviceId;
}

export function getPreferredOutputDeviceId(): string {
	try {
		return normalizePreferredOutputDeviceId(localStorage.getItem(PREFERRED_OUTPUT_DEVICE_STORAGE_KEY));
	} catch {
		return 'default';
	}
}

export function sinkIdForHtmlMediaElement(deviceId: string): string {
	return deviceId === 'default' ? '' : deviceId;
}

export function supportsAudioOutputDeviceSelection(): boolean {
	try {
		return typeof (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId === 'function';
	} catch {
		return false;
	}
}

export function notifyPreferredOutputDeviceChange(deviceId: string) {
	window.dispatchEvent(
		new CustomEvent(OUTPUT_DEVICE_CHANGE_EVENT, {
			detail: normalizePreferredOutputDeviceId(deviceId)
		})
	);
}

export function setPreferredOutputDeviceId(deviceId: string) {
	const normalized = normalizePreferredOutputDeviceId(deviceId);
	try {
		localStorage.setItem(PREFERRED_OUTPUT_DEVICE_STORAGE_KEY, normalized);
	} catch {
		// Storage unavailable: still tell open rooms about the change
	}
	notifyPreferredOutputDeviceChange(normalized);
}

export function parseOutputDeviceChangeEventDetail(detail: unknown): string {
	if (typeof detail === 'string') return normalizePreferredOutputDeviceId(detail);
	if (detail && typeof detail === 'object' && 'deviceId' in detail) {
		const deviceId = (detail as { deviceId?: string }).deviceId;
		return normalizePreferredOutputDeviceId(deviceId);
	}
	return getPreferredOutputDeviceId();
}
