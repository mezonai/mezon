import { Icons } from '@mezon/ui';
import { calculateMediaDimensions, useResizeObserver } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	isMobile?: boolean;
	isPreview?: boolean;
};
export const MIN_WIDTH_VIDEO_SHOW = 200;
export const DEFAULT_HEIGHT_VIDEO_SHOW = 150;

function MessageVideo({ attachmentData, isMobile = false, isPreview = false }: MessageImage) {
	const handleOnCanPlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
		if (e.currentTarget.offsetWidth < MIN_WIDTH_VIDEO_SHOW) {
			setShowControl(false);
		}
	};
	const videoRef = useRef<HTMLVideoElement>(null);
	const [showControl, setShowControl] = useState(true);
	const handleShowFullVideo = () => {
		if (videoRef.current) {
			videoRef.current.requestFullscreen();
			if (videoRef.current.paused) {
				videoRef.current.play();
			}
		}
	};
	const { width: realWidth, height: realHeight } = attachmentData;
	const hasZeroDimension = !realWidth || !realHeight;
	const { width, height, isSmall } = hasZeroDimension
		? { width: (150 * 16) / 9, height: 150, isSmall: false }
		: calculateMediaDimensions({
				media: {
					mediaType: 'video',
					width: realWidth,
					height: realHeight
				},
				isMobile
			});
	const handleResize = useDebouncedCallback(() => {
		const video = videoRef.current;
		if (!video) return;
		setShowControl(video.offsetWidth >= MIN_WIDTH_VIDEO_SHOW);
	}, 100);
	useResizeObserver(videoRef, handleResize);
	useEffect(() => {
		if (!showControl && videoRef.current && !videoRef.current.paused) {
			videoRef.current.pause();
		}
	}, [showControl]);
	const handleDownloadVideo = () => {
		if (attachmentData.url) {
			const a = document.createElement('a');
			a.href = attachmentData.url;
			a.download = attachmentData.filename || 'video';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	return (
		<div className="relative overflow-hidden group rounded-lg" style={isPreview ? { width: '100%', height: '100%' } : { width, height }}>
			<video
				src={attachmentData.url}
				controls={showControl}
				autoPlay={false}
				style={isPreview ? { width: '100%', height: '100%' } : { width: width, height: height }}
				ref={videoRef}
				onCanPlay={(e) => handleOnCanPlay(e)}
				className="object-contain"
			></video>

			{!showControl && (
				<div
					className="cursor-pointer absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-30 group"
					onClick={handleShowFullVideo}
				>
					<Icons.PlayButton className="w-4 h-4 text-white transition-all duration-150 group-hover:scale-110" />
				</div>
			)}

			<div
				className="group-hover:flex hidden top-2 right-1 cursor-pointer absolute bg-bgSurface rounded-md w-6 h-6  items-center justify-center"
				onClick={handleDownloadVideo}
			>
				<Icons.Download defaultSize="!w-4 !h-4 " defaultFill="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
			</div>
		</div>
	);
}
export default MessageVideo;
