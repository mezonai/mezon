import { Icons } from '@mezon/ui';
import { calculateMediaDimensions, useResizeObserver } from '@mezon/utils';
import isElectron from 'is-electron';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	isMobile?: boolean;
	isPreview?: boolean;
};
export const MIN_WIDTH_VIDEO_SHOW = 200;
export const DEFAULT_HEIGHT_VIDEO_SHOW = 150;

function MessageVideo({ attachmentData, isMobile = false, isPreview = false }: MessageImage) {
	const { t } = useTranslation('media');
	const handleOnCanPlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
		if (e.currentTarget.offsetWidth < MIN_WIDTH_VIDEO_SHOW) {
			setShowControl(false);
		}
	};
	const videoRef = useRef<HTMLVideoElement>(null);
	const [showControl, setShowControl] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
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
	const { width, height } = hasZeroDimension
		? { width: (150 * 16) / 9, height: 150 }
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

	useEffect(() => {
		const video = videoRef.current;
		return () => {
			if (video) {
				video.pause();
				video.removeAttribute('src');
				video.load();
			}
		};
	}, []);

	const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
		const video = e.currentTarget;
		const error = video.error;

		let message = t('video.error.cannotPlay');
		if (error) {
			switch (error.code) {
				case error.MEDIA_ERR_ABORTED:
					message = t('video.error.loadingAborted');
					break;
				case error.MEDIA_ERR_NETWORK:
					message = t('video.error.networkError');
					break;
				case error.MEDIA_ERR_DECODE:
					message = isElectron() ? t('video.error.codecNotSupportedElectron') : t('video.error.codecNotSupported');
					break;
				case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
					message = t('video.error.formatNotSupported');
					break;
			}
		}

		setHasError(true);
		setErrorMessage(message);
		console.error('Video playback error:', error?.code, error?.message, attachmentData.url);
	};

	const handleDownloadVideo = async () => {
		if (attachmentData.url) {
			try {
				const response = await fetch(attachmentData.url, {
					mode: 'cors'
				});

				if (!response.ok) throw new Error('Network response was not ok');
				const blob = await response.blob();

				const blobUrl = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = blobUrl;
				a.download = attachmentData.filename || 'video';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(blobUrl);
			} catch (err) {
				console.error('Download failed:', err);
			}
		}
	};

	return (
		<div className="relative overflow-hidden group rounded-lg" style={isPreview ? { width: '100%', height: '100%' } : { width, height }}>
			{hasError ? (
				<div
					className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg bg-bgLightSecondary dark:bg-bgSecondary"
					style={isPreview ? { width: '100%', height: '100%' } : { width, height }}
				>
					<div className="flex flex-col items-center gap-1">
						<p className="text-sm font-medium text-textPrimaryLight dark:text-textPrimary text-center">{t('video.error.title')}</p>
						<p className="text-xs text-textSecondary800 dark:text-textSecondary text-center max-w-[200px]">{errorMessage}</p>
					</div>
					<button
						onClick={handleDownloadVideo}
						className="flex items-center gap-1.5 text-sm font-medium text-textSecondary800 dark:text-textSecondary hover:text-textPrimaryLight dark:hover:text-textPrimary transition-colors"
					>
						<Icons.Download defaultSize="w-3.5 h-3.5" defaultFill="text-textSecondary800 dark:text-textSecondary" />
						{t('video.error.downloadButton')}
					</button>
				</div>
			) : (
				<>
					<video
						controls={showControl}
						autoPlay={false}
						style={isPreview ? { width: '100%', height: '100%' } : { width, height }}
						ref={videoRef}
						onCanPlay={(e) => handleOnCanPlay(e)}
						onError={handleVideoError}
						className="object-contain"
						preload="metadata"
					>
						<source src={attachmentData.url} />
						{t('video.error.browserNotSupported')}
					</video>

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
						<Icons.Download
							defaultSize="!w-4 !h-4 "
							defaultFill="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black"
						/>
					</div>
				</>
			)}
		</div>
	);
}
export default MessageVideo;
