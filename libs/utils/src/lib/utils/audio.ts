import type { AudioCaptureOptions } from 'livekit-client';

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

export type MezonAudioCaptureOptions = AudioCaptureOptions;

export const getNoiseSuppressionAudioCaptureOptions = (enabled: boolean): MezonAudioCaptureOptions => ({
	echoCancellation: true,
	noiseSuppression: !enabled,
	autoGainControl: !enabled,
	voiceIsolation: !enabled
});
