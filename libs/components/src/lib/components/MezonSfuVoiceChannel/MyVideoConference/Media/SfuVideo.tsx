import { useEffect, useRef } from 'react';

interface SfuVideoProps {
	stream: MediaStream;
	muted?: boolean;
	mirrored?: boolean;
	fit?: 'cover' | 'contain';
	onFrameStateChange?: (hasRecentFrame: boolean) => void;
}

export const SfuVideo = ({ stream, muted = false, mirrored = false, fit = 'cover', onFrameStateChange }: SfuVideoProps) => {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		video.srcObject = stream;
		video.play().catch(() => undefined);
		if (!onFrameStateChange) return;

		if (!video.requestVideoFrameCallback) {
			const markFrameAvailable = () => onFrameStateChange(true);
			const markFrameUnavailable = () => onFrameStateChange(false);
			onFrameStateChange(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
			video.addEventListener('loadeddata', markFrameAvailable);
			video.addEventListener('playing', markFrameAvailable);
			video.addEventListener('timeupdate', markFrameAvailable);
			video.addEventListener('emptied', markFrameUnavailable);
			return () => {
				video.removeEventListener('loadeddata', markFrameAvailable);
				video.removeEventListener('playing', markFrameAvailable);
				video.removeEventListener('timeupdate', markFrameAvailable);
				video.removeEventListener('emptied', markFrameUnavailable);
			};
		}

		let disposed = false;
		let frameCallbackId = 0;
		const handleFrame: VideoFrameRequestCallback = () => {
			if (disposed) return;
			onFrameStateChange(true);
			frameCallbackId = video.requestVideoFrameCallback(handleFrame);
		};
		onFrameStateChange(false);
		frameCallbackId = video.requestVideoFrameCallback(handleFrame);
		return () => {
			disposed = true;
			video.cancelVideoFrameCallback(frameCallbackId);
		};
	}, [onFrameStateChange, stream]);

	return (
		<video
			ref={ref}
			autoPlay
			playsInline
			muted={muted}
			className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${mirrored ? '-scale-x-100' : ''}`}
		/>
	);
};
