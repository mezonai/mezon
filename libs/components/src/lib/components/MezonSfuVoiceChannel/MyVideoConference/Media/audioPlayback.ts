export type AudioPlaybackFailure = (track: MediaStreamTrack, reason: string) => void;

export const attachAudioPlayback = (element: HTMLAudioElement, track: MediaStreamTrack, onFailure?: AudioPlaybackFailure) => {
	let disposed = false;
	let inFlight = false;
	let blocked = false;
	let failures = 0;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let failureTimer: ReturnType<typeof setTimeout> | undefined;
	const clearFailure = () => {
		if (failureTimer !== undefined) clearTimeout(failureTimer);
		failureTimer = undefined;
	};
	const reportFailure = (reason: string) => {
		if (!onFailure || failureTimer !== undefined) return;
		failureTimer = setTimeout(() => {
			failureTimer = undefined;
			if (!disposed && element.srcObject === stream && !element.muted && element.volume > 0 && element.paused) onFailure(track, reason);
		}, 15_000);
	};
	const stream = new MediaStream([track]);
	element.srcObject = stream;

	const clearRetry = () => {
		if (retryTimer !== undefined) clearTimeout(retryTimer);
		retryTimer = undefined;
	};
	const play = () => {
		if (disposed || inFlight || blocked || failures >= 4 || track.readyState !== 'live' || element.srcObject !== stream) return;
		inFlight = true;
		void element
			.play()
			.catch((cause: unknown) => {
				if (disposed || element.srcObject !== stream) return;
				const name = cause instanceof Error ? cause.name : 'PlaybackError';
				// eslint-disable-next-line no-console
				console.warn('[MezonSFU] remote audio playback failed', { trackId: track.id, name });
				if (name === 'NotAllowedError') {
					blocked = true;
					reportFailure('audio_playback_blocked');
					return;
				}
				failures += 1;
				reportFailure('audio_playback_failed');
				if (failures < 4) {
					clearRetry();
					retryTimer = setTimeout(
						() => {
							retryTimer = undefined;
							play();
						},
						500 * 2 ** (failures - 1)
					);
				}
			})
			.finally(() => {
				inFlight = false;
			});
	};
	const resume = () => {
		if (inFlight || retryTimer !== undefined || (!element.paused && !blocked)) return;
		clearRetry();
		play();
	};
	const gesture = () => {
		if (!blocked && !element.paused) return;
		blocked = false;
		failures = 0;
		clearRetry();
		resume();
	};
	const playing = () => {
		clearFailure();
		blocked = false;
		failures = 0;
		clearRetry();
	};
	const unmute = () => {
		failures = 0;
		clearRetry();
		resume();
	};
	track.addEventListener('unmute', unmute);
	element.addEventListener('canplay', resume);
	element.addEventListener('pause', resume);
	element.addEventListener('playing', playing);
	document.addEventListener('pointerdown', gesture, true);
	document.addEventListener('keydown', gesture, true);
	play();
	return () => {
		disposed = true;
		clearRetry();
		clearFailure();
		track.removeEventListener('unmute', unmute);
		element.removeEventListener('canplay', resume);
		element.removeEventListener('pause', resume);
		element.removeEventListener('playing', playing);
		document.removeEventListener('pointerdown', gesture, true);
		document.removeEventListener('keydown', gesture, true);
		if (element.srcObject === stream) {
			element.pause();
			element.srcObject = null;
		}
	};
};
