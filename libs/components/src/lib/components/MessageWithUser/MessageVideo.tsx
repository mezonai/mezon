import { Icons } from '@mezon/ui';
import { calculateMediaDimensions, useResizeObserver } from '@mezon/utils';
import isElectron from 'is-electron';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import type { Movie, Track } from 'mp4box';
import { MP4BoxBuffer, createFile } from 'mp4box';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	isMobile?: boolean;
	isPreview?: boolean;
};
export const MIN_WIDTH_VIDEO_SHOW = 200;
export const DEFAULT_HEIGHT_VIDEO_SHOW = 150;

type VideoProbeStatus = 'probing' | 'ready' | 'unsupported' | 'error';

const RANGE_PROBE_SIZE = 1024 * 1024;
const MP4BOX_TIMEOUT_MS = 5000;

interface VideoCodecInfo {
	codec: string;
	isHEVC: boolean;
	isMain10: boolean;
	isDolbyVision: boolean;
	isAppleDevice: boolean;
}

function isElectronMac(): boolean {
	return isElectron() && navigator.platform?.toLowerCase().includes('mac');
}

async function probeVideoCodec(url: string, signal?: AbortSignal): Promise<VideoCodecInfo | null> {
	try {
		const response = await fetch(url, {
			headers: { Range: `bytes=0-${RANGE_PROBE_SIZE - 1}` },
			signal
		});

		if (!response.ok && response.status !== 206) {
			return null;
		}

		const arrayBuffer = await response.arrayBuffer();

		return new Promise<VideoCodecInfo | null>((resolve) => {
			const mp4boxFile = createFile();
			let resolved = false;

			const cleanup = () => {
				mp4boxFile.onReady = undefined;
				mp4boxFile.onError = undefined;
				mp4boxFile.flush();
			};

			const finalize = (result: VideoCodecInfo | null) => {
				if (resolved) return;
				resolved = true;
				clearTimeout(timeout);
				cleanup();
				resolve(result);
			};

			const timeout = setTimeout(() => finalize(null), MP4BOX_TIMEOUT_MS);

			mp4boxFile.onReady = (info: Movie) => {
				const videoTrack: Track | undefined = info.videoTracks?.[0] || info.tracks?.find((t: Track) => t.type === 'video');
				if (!videoTrack) {
					finalize(null);
					return;
				}

				const codec: string = videoTrack.codec || '';
				const isHEVC = codec.startsWith('hev1') || codec.startsWith('hvc1');
				const isDolbyVision = codec.startsWith('dvh1') || codec.startsWith('dvhe');
				const profileMatch = isHEVC ? codec.match(/^(?:hev1|hvc1)\.(\d+)/) : null;
				const isMain10 = profileMatch ? parseInt(profileMatch[1]) === 2 : false;

				const appleTrackNames = ['core media video', 'core media audio'];
				const appleBrands = ['mp42'];
				const isAppleDevice =
					appleTrackNames.some((name) => videoTrack.name?.toLowerCase().includes(name)) ||
					(info.brands?.some((b: string) => appleBrands.includes(b)) && videoTrack.timescale === 600);

				finalize({ codec, isHEVC, isMain10, isDolbyVision, isAppleDevice });
			};

			mp4boxFile.onError = () => finalize(null);

			const mp4Buffer = MP4BoxBuffer.fromArrayBuffer(arrayBuffer, 0);
			mp4boxFile.appendBuffer(mp4Buffer);
		});
	} catch {
		return null;
	}
}

function isUnsafeCodec(info: VideoCodecInfo): boolean {
	if (info.isDolbyVision) return true;
	if (info.isHEVC && info.isMain10) return true;
	if (info.isAppleDevice) return true;
	return false;
}

function useVideoProbe(url: string | undefined) {
	const [status, setStatus] = useState<VideoProbeStatus>('probing');
	const [errorMessage, setErrorMessage] = useState('');
	const [codecInfo, setCodecInfo] = useState<VideoCodecInfo | null>(null);
	const { t } = useTranslation('media');

	useEffect(() => {
		if (!url) {
			setStatus('error');
			setErrorMessage(t('video.error.cannotPlay'));
			return;
		}

		setStatus('probing');
		setErrorMessage('');
		setCodecInfo(null);

		const abortController = new AbortController();
		let cancelled = false;

		const runProbe = async () => {
			const info = await probeVideoCodec(url, abortController.signal);

			if (cancelled) return;

			if (info) {
				setCodecInfo(info);
				if (isUnsafeCodec(info)) {
					setStatus('unsupported');
					setErrorMessage(t('video.error.codecNotSupportedElectron'));
					return;
				}
			}

			if (!cancelled) {
				setStatus('ready');
			}
		};

		runProbe();

		return () => {
			cancelled = true;
			abortController.abort();
		};
	}, [url, t]);

	return { status, errorMessage, codecInfo };
}

function useVideoMediaDimensions(attachmentData: ApiMessageAttachment, isMobile: boolean, isPreview: boolean) {
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
	const mediaBoxStyle = isPreview
		? { width: '100%', height: '100%' }
		: { width: '100%', maxWidth: `${width}px`, aspectRatio: `${width} / ${height}` };
	const mediaStyle = { width: '100%', height: '100%' };

	return { width, height, mediaBoxStyle, mediaStyle };
}

function useDownloadVideo(url?: string, filename?: string) {
	return useCallback(async () => {
		if (!url) return;
		try {
			const response = await fetch(url, { mode: 'cors' });
			if (!response.ok) throw new Error('Network response was not ok');
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename || 'video';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			// ignore
		}
	}, [url, filename]);
}

function MacElectronVideo({ attachmentData, isMobile = false, isPreview = false }: MessageImage) {
	const { t } = useTranslation('media');
	const { status: probeStatus, errorMessage, codecInfo } = useVideoProbe(attachmentData.url);
	const { mediaBoxStyle, mediaStyle } = useVideoMediaDimensions(attachmentData, isMobile, isPreview);
	const handleDownloadVideo = useDownloadVideo(attachmentData.url, attachmentData.filename);

	const videoRef = useRef<HTMLVideoElement>(null);
	const [showControl, setShowControl] = useState(true);

	const handleOnCanPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
		if (e.currentTarget.offsetWidth < MIN_WIDTH_VIDEO_SHOW) {
			setShowControl(false);
		}
	}, []);

	const handleShowFullVideo = useCallback(() => {
		if (videoRef.current) {
			videoRef.current.requestFullscreen();
			if (videoRef.current.paused) {
				videoRef.current.play();
			}
		}
	}, []);

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
		<div className="relative overflow-hidden group rounded-lg" style={mediaBoxStyle}>
			{probeStatus === 'probing' && (
				<div className="flex items-center justify-center bg-bgLightSecondary dark:bg-bgSecondary rounded-lg" style={mediaStyle}>
					<div className="w-8 h-8 border-2 border-textSecondary800 dark:border-textSecondary border-t-transparent rounded-full animate-spin" />
				</div>
			)}

			{(probeStatus === 'error' || probeStatus === 'unsupported') && (
				<div
					className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg bg-bgLightSecondary dark:bg-bgSecondary"
					style={mediaStyle}
				>
					<div className="flex flex-col items-center gap-1">
						<p className="text-sm font-medium text-textPrimaryLight dark:text-textPrimary text-center">{t('video.error.title')}</p>
						<p className="text-xs text-textSecondary800 dark:text-textSecondary text-center max-w-[200px]">{errorMessage}</p>
						{probeStatus === 'unsupported' && codecInfo && (
							<p className="text-[10px] text-textSecondary800 dark:text-textSecondary text-center mt-1 font-mono">{codecInfo.codec}</p>
						)}
					</div>
					<button
						onClick={handleDownloadVideo}
						className="flex items-center gap-1.5 text-sm font-medium text-textSecondary800 dark:text-textSecondary hover:text-textPrimaryLight dark:hover:text-textPrimary transition-colors"
					>
						<Icons.Download defaultSize="w-3.5 h-3.5" defaultFill="text-textSecondary800 dark:text-textSecondary" />
						{t('video.error.downloadButton')}
					</button>
				</div>
			)}

			{probeStatus === 'ready' && (
				<>
					<video
						controls={showControl}
						autoPlay={false}
						style={mediaStyle}
						ref={videoRef}
						onCanPlay={handleOnCanPlay}
						className="object-contain"
						preload="metadata"
						playsInline
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

function DefaultVideo({ attachmentData, isMobile = false, isPreview = false }: MessageImage) {
	const { t } = useTranslation('media');
	const { mediaBoxStyle, mediaStyle } = useVideoMediaDimensions(attachmentData, isMobile, isPreview);
	const handleDownloadVideo = useDownloadVideo(attachmentData.url, attachmentData.filename);

	const videoRef = useRef<HTMLVideoElement>(null);
	const [showControl, setShowControl] = useState(true);

	const handleOnCanPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
		if (e.currentTarget.offsetWidth < MIN_WIDTH_VIDEO_SHOW) {
			setShowControl(false);
		}
	}, []);

	const handleShowFullVideo = useCallback(() => {
		if (videoRef.current) {
			videoRef.current.requestFullscreen();
			if (videoRef.current.paused) {
				videoRef.current.play();
			}
		}
	}, []);

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
		<div className="relative overflow-hidden group rounded-lg" style={mediaBoxStyle}>
			<video
				controls={showControl}
				autoPlay={false}
				style={mediaStyle}
				ref={videoRef}
				onCanPlay={handleOnCanPlay}
				className="object-contain"
				preload="metadata"
				playsInline
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
				<Icons.Download defaultSize="!w-4 !h-4 " defaultFill="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
			</div>
		</div>
	);
}

function MessageVideo(props: MessageImage) {
	if (isElectronMac()) {
		return <MacElectronVideo {...props} />;
	}
	return <DefaultVideo {...props} />;
}

export default MessageVideo;
