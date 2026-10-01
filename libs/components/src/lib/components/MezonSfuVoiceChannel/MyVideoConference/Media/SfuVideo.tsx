import { useEffect, useRef } from 'react';

interface SfuVideoProps {
	stream: MediaStream;
	muted?: boolean;
	mirrored?: boolean;
	fit?: 'cover' | 'contain';
	onFrameStateChange?: (hasRecentFrame: boolean) => void;
	onFrame?: () => void;
	onPictureInPictureChange?: (active: boolean) => void;
}

export const SfuVideo = ({
	stream,
	muted = false,
	mirrored = false,
	fit = 'cover',
	onFrameStateChange,
	onFrame,
	onPictureInPictureChange
}: SfuVideoProps) => {
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		video.srcObject = stream;
		video.play().catch(() => undefined);
		let disposed = false;
		let frameCallbackId: number | undefined;
		const markFrameAvailable = () => {
			if (disposed || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) return;
			onFrameStateChange?.(true);
			onFrame?.();
		};
		const markFrameUnavailable = () => onFrameStateChange?.(false);
		markFrameUnavailable();
		if (onFrameStateChange || onFrame) {
			// loadeddata also detects the first decoded frame on browsers without rVFC.
			video.addEventListener('loadeddata', markFrameAvailable);
			if (!video.requestVideoFrameCallback) {
				video.addEventListener('playing', markFrameAvailable);
				video.addEventListener('timeupdate', markFrameAvailable);
			}
			video.addEventListener('emptied', markFrameUnavailable);
			// Wait for a media event/frame: readyState may still describe the previous srcObject.
			if (video.requestVideoFrameCallback) {
				const handleFrame: VideoFrameRequestCallback = () => {
					if (disposed) return;
					markFrameAvailable();
					frameCallbackId = video.requestVideoFrameCallback(handleFrame);
				};
				frameCallbackId = video.requestVideoFrameCallback(handleFrame);
			}
		}
		return () => {
			disposed = true;
			if (frameCallbackId !== undefined) video.cancelVideoFrameCallback(frameCallbackId);
			video.removeEventListener('loadeddata', markFrameAvailable);
			video.removeEventListener('playing', markFrameAvailable);
			video.removeEventListener('timeupdate', markFrameAvailable);
			video.removeEventListener('emptied', markFrameUnavailable);
			if (video.srcObject === stream) video.srcObject = null;
		};
	}, [onFrame, onFrameStateChange, stream]);

	useEffect(() => {
		const video = ref.current;
		if (!video || !onPictureInPictureChange) return;
		const enter = () => onPictureInPictureChange(true);
		const leave = () => onPictureInPictureChange(false);
		video.addEventListener('enterpictureinpicture', enter);
		video.addEventListener('leavepictureinpicture', leave);
		return () => {
			video.removeEventListener('enterpictureinpicture', enter);
			video.removeEventListener('leavepictureinpicture', leave);
		};
	}, [onPictureInPictureChange]);

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
