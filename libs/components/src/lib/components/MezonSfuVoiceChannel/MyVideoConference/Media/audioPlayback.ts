/** Bind one remote track without stopping the WebRTC-owned receiver on cleanup. */
export const attachAudioPlayback = (element: HTMLAudioElement, track: MediaStreamTrack) => {
	let disposed = false;
	let inFlight = false;
	let blocked = false;
	let failures = 0;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
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
					return;
				}
				failures += 1;
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
	// Retry synchronously inside user activation if autoplay was rejected.
	document.addEventListener('pointerdown', gesture, true);
	document.addEventListener('keydown', gesture, true);
	play();
	return () => {
		disposed = true;
		clearRetry();
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
