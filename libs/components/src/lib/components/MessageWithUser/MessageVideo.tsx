import { calculateMediaDimensions, useResizeObserver } from '@mezon/utils';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	isMobile?: boolean;
};

export const MIN_WIDTH_VIDEO_SHOW = 200;
export const DEFAULT_HEIGHT_VIDEO_SHOW = 150;

const PlayButton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
	<svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
		<path d="M8 5v14l11-7z" />
	</svg>
);

const Download = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor">
		<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
	</svg>
);
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
		<div className="relative overflow-hidden w-full h-full group rounded-xl bg-gray-900/5 dark:bg-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300 ease-out border border-gray-200/50 dark:border-gray-700/50">
			<div className="relative w-full h-full rounded-xl overflow-hidden">
				<video
					src={attachmentData.url}
					controls={showControl}
					autoPlay={false}
					ref={videoRef}
					onCanPlay={(e) => handleOnCanPlay(e)}
					className="w-full h-full object-contain rounded-xl bg-black/5 dark:bg-black/20"
				></video>
			</div>

			{!showControl && (
				<div
					className="cursor-pointer absolute inset-0 flex items-center justify-center z-20 group/play rounded-xl transition-all duration-300"
					onClick={handleShowFullVideo}
				>
					<div className="bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm p-2">
						<PlayButton
							className="text-gray-700 dark:text-gray-200 transition-colors duration-200"
							style={{
								width: '16px',
								height: '16px'
							}}
						/>
					</div>
				</div>
			)}

			{showControl && (
				<div
					className="group-hover:opacity-100 opacity-0 top-4 right-4 cursor-pointer absolute bg-gradient-to-br from-black/70 to-black/50 dark:from-gray-800/80 dark:to-gray-900/70 backdrop-blur-md rounded-xl w-11 h-11 flex items-center justify-center transition-all duration-300 hover:from-black/90 hover:to-black/70 dark:hover:from-gray-700/90 dark:hover:to-gray-800/80 shadow-xl border border-white/20 dark:border-gray-600/30"
					onClick={handleDownloadVideo}
				>
					<Download className="w-5 h-5 text-white/90 hover:text-white transition-colors duration-200 drop-shadow-sm" />
				</div>
			)}

			<div className="absolute bottom-0 left-0 right-0 h-1.5  rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm"></div>
		</div>
	);
}

export default MessageVideo;
