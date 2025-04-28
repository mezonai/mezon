import { Icons } from '@mezon/ui';
import { calculateMediaDimensions, useResizeObserver } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	isMobile?: boolean;
};
export const MIN_WIDTH_VIDEO_SHOW = 200;
export const DEFAULT_HEIGHT_VIDEO_SHOW = 150;

function MessageVideo({ attachmentData, isMobile = false }: MessageImage) {
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
	// const handleTogglePlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
	// 	e.preventDefault();
	// 	e.stopPropagation();
	// 	if (e.currentTarget.paused) {
	// 		e.currentTarget.play();
	// 	} else {
	// 		e.currentTarget.pause();
	// 	}
	// };

	// const height = Number(attachmentData?.height) > Number(attachmentData?.width) ? 350 : 275;

	const { width: realWidth, height: realHeight } = attachmentData;
	const hasZeroDimension = !realWidth || !realHeight;

	const { width, height, isSmall } = hasZeroDimension
		? { width: 0, height: 150, isSmall: false }
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

	return (
		<div className="relative overflow-hidden w-full h-full rounded-lg">
			<video
				src={attachmentData.url}
				controls={showControl}
				autoPlay={false}
				style={{
					width: width,
					height: height
				}}
				ref={videoRef}
				onCanPlay={(e) => handleOnCanPlay(e)}
			></video>
			{!showControl && (
				<div
					className="cursor-pointer absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-30 group"
					onClick={handleShowFullVideo}
				>
					<Icons.PlayButton className="w-4 h-4 text-white transition-transform transition-colors duration-150 group-hover:scale-110" />
				</div>
			)}
			{/* {!showControl && (
				<div className="bottom-1 right-1 absolute w-4 h-4 rounded overflow-hidden cursor-pointer z-10" onClick={handleShowFullVideo}>
					<Icons.FullScreen className="w-4 h-4 dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
				</div>
			)} */}
		</div>
	);
}

export default MessageVideo;
