import { Icons } from '@mezon/ui';
import { calculateMediaDimensions, createImgproxyUrl, useIsIntersecting, useResizeObserver, type ObserveFn } from '@mezon/utils';
import isElectron from 'is-electron';
import type { ApiMessageAttachment } from 'mezon-js';
import type { Movie, Track } from 'mp4box';
import { MP4BoxBuffer, createFile } from 'mp4box';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import { AttachmentSendingIndicator } from './AttachmentSendingIndicator';
export type MessageImage = {
	readonly attachmentData: ApiMessageAttachment;
	isMobile?: boolean;
	isPreview?: boolean;
	isSending?: boolean;
	observeIntersection?: ObserveFn;
};
export const MIN_WIDTH_VIDEO_SHOW = 200;
export const DEFAULT_HEIGHT_VIDEO_SHOW = 150;

type VideoProbeStatus = 'idle' | 'probing' | 'ready' | 'unsupported' | 'error';

const INITIAL_PROBE_SIZE = 64 * 1024;
const NEXT_PROBE_CHUNK_SIZE = 128 * 1024;
const MAX_PROBE_BYTES = 512 * 1024;
const MP4BOX_TIMEOUT_MS = 5000;

function isLikelyQuickTimeUrl(url?: string, filename?: string): boolean {
	const path = (filename || url || '').split('?')[0].toLowerCase();
	return path.endsWith('.mov') || path.endsWith('.qt');
}

interface VideoCodecInfo {
	codec: string;
	isHEVC: boolean;
	isMain10: boolean;
	isDolbyVision: boolean;
	isAppleDevice: boolean;
}

interface ProbeResult {
	codec: VideoCodecInfo | null;
	isFastStart: boolean | null;
	reason: string;
}

interface VideoProbeRange {
	buffer: MP4BoxBuffer;
	start: number;
	end: number;
	totalSize: number | null;
}

interface ParsedContentRange {
	start: number;
	end: number;
	totalSize: number | null;
}

function isElectronMac(): boolean {
	return isElectron() && navigator.platform?.toLowerCase().includes('mac');
}

function parseContentRangeHeader(contentRange: string | null): ParsedContentRange | null {
	if (!contentRange) return null;

	const match = contentRange.match(/^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i);
	if (!match) return null;

	const start = Number(match[1]);
	const end = Number(match[2]);
	const totalSize = match[3] === '*' ? null : Number(match[3]);

	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return null;
	if (totalSize !== null && !Number.isSafeInteger(totalSize)) return null;

	return { start, end, totalSize };
}

async function fetchVideoProbeRange(url: string, start: number, end: number | undefined, signal?: AbortSignal): Promise<VideoProbeRange | null> {
	const response = await fetch(url, {
		headers: { Range: end === undefined ? `bytes=${start}-` : `bytes=${start}-${end}` },
		signal
	});

	if (response.status !== 206) {
		void response.body?.cancel().catch(() => undefined);
		return null;
	}

	const arrayBuffer = await response.arrayBuffer();
	const parsedContentRange = parseContentRangeHeader(response.headers.get('Content-Range'));
	const responseStart = parsedContentRange?.start ?? start;
	const totalSize = parsedContentRange?.totalSize ?? null;
	const buffer = MP4BoxBuffer.fromArrayBuffer(arrayBuffer, responseStart);

	return {
		buffer,
		start: responseStart,
		end: responseStart + arrayBuffer.byteLength - 1,
		totalSize
	};
}

function parseCodecFromMovie(info: Movie): VideoCodecInfo | null {
	const videoTrack: Track | undefined = info.videoTracks?.[0] || info.tracks?.find((t: Track) => t.type === 'video');
	if (!videoTrack) {
		return null;
	}

	const codec: string = videoTrack.codec || '';
	const isHEVC = codec.startsWith('hev1') || codec.startsWith('hvc1');
	const isDolbyVision = codec.startsWith('dvh1') || codec.startsWith('dvhe');
	const profileMatch = isHEVC ? codec.match(/^(?:hev1|hvc1)\.(\d+)/) : null;
	const isMain10 = profileMatch ? parseInt(profileMatch[1]) === 2 : false;

	const appleTrackNames = ['core media video', 'core media audio'];
	const appleBrands = ['mp42', 'qt  '];
	const isAppleDevice =
		appleTrackNames.some((name) => videoTrack.name?.toLowerCase().includes(name)) ||
		(info.brands?.some((b: string) => appleBrands.includes(b)) && videoTrack.timescale === 600);

	return { codec, isHEVC, isMain10, isDolbyVision, isAppleDevice };
}

async function probeVideoCodec(url: string, signal?: AbortSignal): Promise<ProbeResult> {
	return new Promise((resolve) => {
		const mp4boxFile = createFile();
		let resolved = false;
		let bytesFetched = 0;
		let lastProbeRange: VideoProbeRange | null = null;
		let totalSize: number | null = null;
		let nextBufferStart: number | undefined;
		let moovBeforeMdat: boolean | null = null;

		const timeout = setTimeout(() => finalize(null, 'timeout'), MP4BOX_TIMEOUT_MS);

		function cleanup() {
			clearTimeout(timeout);
			mp4boxFile.onReady = undefined;
			mp4boxFile.onError = undefined;
			mp4boxFile.flush();
		}

		const detectFastStart = () => {
			if (moovBeforeMdat !== null) return;
			const boxes = (mp4boxFile as unknown as { boxes?: Array<{ type: string }> }).boxes;
			if (!boxes) return;
			for (const box of boxes) {
				if (box.type === 'moov') {
					moovBeforeMdat = true;
					return;
				}
				if (box.type === 'mdat') {
					moovBeforeMdat = false;
					return;
				}
			}
		};

		function finalize(result: VideoCodecInfo | null, reason: string) {
			if (resolved) return;
			resolved = true;
			cleanup();
			resolve({ codec: result, isFastStart: moovBeforeMdat, reason });
		}

		const flushAndFinalize = (reason: string) => {
			mp4boxFile.flush();
			if (!resolved) {
				finalize(null, reason);
			}
		};

		const appendRange = (range: VideoProbeRange) => {
			lastProbeRange = range;
			totalSize = range.totalSize ?? totalSize;
			bytesFetched += range.end - range.start + 1;
			nextBufferStart = mp4boxFile.appendBuffer(range.buffer);
			detectFastStart();
		};

		const getNextRequestedStart = () => {
			if (
				typeof nextBufferStart === 'number' &&
				Number.isSafeInteger(nextBufferStart) &&
				(!lastProbeRange || nextBufferStart > lastProbeRange.end)
			) {
				return nextBufferStart;
			}
			return lastProbeRange ? lastProbeRange.end + 1 : 0;
		};

		mp4boxFile.onReady = (info: Movie) => finalize(parseCodecFromMovie(info), 'mp4box-ready');
		mp4boxFile.onError = () => finalize(null, 'mp4box-error');

		const runProbe = async () => {
			const firstRange = await fetchVideoProbeRange(url, 0, INITIAL_PROBE_SIZE - 1, signal);
			if (!firstRange) {
				finalize(null, 'first-range-failed');
				return;
			}

			appendRange(firstRange);

			while (!resolved && bytesFetched < MAX_PROBE_BYTES) {
				const requestedStart = getNextRequestedStart();
				if (totalSize !== null && requestedStart > totalSize - 1) {
					flushAndFinalize('reached-eof-no-moov');
					return;
				}

				const remainingBudget = MAX_PROBE_BYTES - bytesFetched;
				const chunkSize = Math.min(NEXT_PROBE_CHUNK_SIZE, remainingBudget);
				if (chunkSize <= 0) break;

				const requestedEnd = totalSize === null ? requestedStart + chunkSize - 1 : Math.min(totalSize - 1, requestedStart + chunkSize - 1);
				const probeRange = await fetchVideoProbeRange(url, requestedStart, requestedEnd, signal);
				if (!probeRange) {
					flushAndFinalize('chunk-range-failed');
					return;
				}

				appendRange(probeRange);
			}

			flushAndFinalize('budget-exhausted');
		};

		runProbe().catch(() => finalize(null, 'exception'));
	});
}

function isUnsafeCodec(info: VideoCodecInfo): boolean {
	return info.isDolbyVision || (info.isHEVC && info.isMain10) || info.isAppleDevice;
}

function useVideoProbe(url: string | undefined, shouldProbe: boolean, filename?: string) {
	const [status, setStatus] = useState<VideoProbeStatus>('idle');
	const [errorMessage, setErrorMessage] = useState('');
	const [codecInfo, setCodecInfo] = useState<VideoCodecInfo | null>(null);
	const { t } = useTranslation('media');
	const strictProbe = isElectronMac();

	useEffect(() => {
		if (!shouldProbe) {
			setStatus('idle');
			return;
		}

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
		const unsupportedMessage = strictProbe ? t('video.error.codecNotSupportedElectron') : t('video.error.codecNotSupported');

		const runProbe = async () => {
			const { codec: info, isFastStart } = await probeVideoCodec(url, abortController.signal);

			if (cancelled) return;

			if (info) {
				setCodecInfo(info);
			}

			if (info && isUnsafeCodec(info)) {
				setStatus('unsupported');
				setErrorMessage(unsupportedMessage);
				return;
			}

			if (strictProbe && isFastStart === false) {
				setStatus('unsupported');
				setErrorMessage(unsupportedMessage);
				return;
			}

			const quicktimeFallback = strictProbe && !info && isLikelyQuickTimeUrl(url, filename);
			if (quicktimeFallback) {
				setStatus('unsupported');
				setErrorMessage(unsupportedMessage);
				return;
			}

			setStatus('ready');
		};

		runProbe();

		return () => {
			cancelled = true;
			abortController.abort();
		};
	}, [url, filename, t, shouldProbe, strictProbe]);

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
	const mediaStyle: React.CSSProperties = { width, maxWidth: '100%', aspectRatio: `${width} / ${height}` };

	return { width, height, mediaBoxStyle, mediaStyle };
}

function useDownloadVideo(url?: string, filename?: string) {
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			abortRef.current = null;
		};
	}, []);

	return useCallback(async () => {
		if (!url) return;

		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		try {
			const response = await fetch(url, { mode: 'cors', signal: controller.signal });
			if (!response.ok) return;
			const blob = await response.blob();
			if (controller.signal.aborted) return;
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename || 'video';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			/* aborted or network error */
		}
	}, [url, filename]);
}

function useVideoCleanup(videoRef: React.RefObject<HTMLVideoElement | null>, isActive: boolean) {
	const prevActiveRef = useRef(isActive);

	useEffect(() => {
		if (prevActiveRef.current && !isActive && videoRef.current) {
			const video = videoRef.current;
			video.pause();
			video.removeAttribute('src');
			video.load();
		}
		prevActiveRef.current = isActive;
	}, [isActive, videoRef]);

	useEffect(() => {
		const video = videoRef.current;
		return () => {
			if (video) {
				video.pause();
				video.removeAttribute('src');
				video.load();
			}
		};
	}, [videoRef]);
}

function VideoSkeleton({ style }: { style: React.CSSProperties }) {
	return (
		<div className="flex items-center justify-center bg-bgLightSecondary dark:bg-bgSecondary rounded-lg" style={style}>
			<div className="w-8 h-8 border-2 border-textSecondary800 dark:border-textSecondary border-t-transparent rounded-full animate-spin" />
		</div>
	);
}

function VideoPoster({
	thumbnailUrl,
	style,
	onPlay,
	disablePlay = false,
	isSending = false
}: {
	thumbnailUrl?: string;
	style: React.CSSProperties;
	onPlay: () => void;
	disablePlay?: boolean;
	isSending?: boolean;
}) {
	return (
		<div
			className={`relative overflow-hidden rounded-lg bg-bgLightSecondary dark:bg-bgSecondary flex items-center justify-center ${
				disablePlay ? 'cursor-default' : 'cursor-pointer'
			}`}
			style={style}
			onClick={disablePlay ? undefined : onPlay}
		>
			{thumbnailUrl && <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />}
			{isSending ? (
				<AttachmentSendingIndicator />
			) : (
				<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group">
					<div className="flex items-center justify-center w-12 h-12 rounded-full bg-black bg-opacity-50 transition-transform duration-150 group-hover:scale-110">
						<Icons.PlayButton className="w-5 h-5 text-white" />
					</div>
				</div>
			)}
		</div>
	);
}

function resolveVideoThumbnailUrl(attachmentData: ApiMessageAttachment, width: number, height: number): string | undefined {
	const thumb = attachmentData.thumbnail;
	if (!thumb) return undefined;
	if (thumb.startsWith('blob:')) return thumb;
	return createImgproxyUrl(thumb, { width: Math.round(width), height: Math.round(height), resizeType: 'fit' });
}

function MacElectronVideo({ attachmentData, isMobile = false, isPreview = false, isSending = false, observeIntersection }: MessageImage) {
	const { t } = useTranslation('media');
	const containerRef = useRef<HTMLDivElement>(null);
	const isIntersecting = useIsIntersecting(containerRef, observeIntersection);
	const [activated, setActivated] = useState(false);
	const { status: probeStatus, errorMessage, codecInfo } = useVideoProbe(attachmentData.url, isIntersecting && activated, attachmentData.filename);
	const { width, height, mediaStyle } = useVideoMediaDimensions(attachmentData, isMobile, isPreview);
	const handleDownloadVideo = useDownloadVideo(attachmentData.url, attachmentData.filename);

	const videoRef = useRef<HTMLVideoElement>(null);
	const [showControl, setShowControl] = useState(true);
	const shouldRenderVideo = activated && probeStatus === 'ready' && !isSending;

	const thumbnailUrl = resolveVideoThumbnailUrl(attachmentData, width, height);

	const handlePlay = useCallback(() => {
		if (isSending) return;
		setActivated(true);
	}, [isSending]);

	useVideoCleanup(videoRef, shouldRenderVideo);

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

	const showMedia = isSending || isIntersecting;

	return (
		<div ref={containerRef} className="relative overflow-hidden group rounded-lg max-w-full">
			{!showMedia && <VideoSkeleton style={mediaStyle} />}

			{showMedia && !activated && (
				<VideoPoster thumbnailUrl={thumbnailUrl} style={mediaStyle} onPlay={handlePlay} disablePlay={isSending} isSending={isSending} />
			)}

			{activated && (probeStatus === 'idle' || probeStatus === 'probing') && <VideoSkeleton style={mediaStyle} />}

			{activated && (probeStatus === 'error' || probeStatus === 'unsupported') && (
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

			{shouldRenderVideo && (
				<>
					<video
						controls={showControl}
						autoPlay
						style={mediaStyle}
						ref={videoRef}
						onCanPlay={handleOnCanPlay}
						className="object-contain"
						preload="auto"
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

function DefaultVideo({ attachmentData, isMobile = false, isPreview = false, isSending = false, observeIntersection }: MessageImage) {
	const { t } = useTranslation('media');
	const containerRef = useRef<HTMLDivElement>(null);
	const isIntersecting = useIsIntersecting(containerRef, observeIntersection);
	const [activated, setActivated] = useState(false);
	const { width, height, mediaStyle } = useVideoMediaDimensions(attachmentData, isMobile, isPreview);
	const handleDownloadVideo = useDownloadVideo(attachmentData.url, attachmentData.filename);
	const thumbnailUrl = resolveVideoThumbnailUrl(attachmentData, width, height);

	const videoRef = useRef<HTMLVideoElement>(null);
	const [showControl, setShowControl] = useState(true);
	const shouldRenderVideo = activated && isIntersecting && !isSending;

	useVideoCleanup(videoRef, shouldRenderVideo);

	const handlePlay = useCallback(() => {
		if (isSending) return;
		setActivated(true);
	}, [isSending]);

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

	const showMedia = isSending || isIntersecting;

	return (
		<div ref={containerRef} className="relative overflow-hidden group rounded-lg max-w-full">
			{!showMedia && <VideoSkeleton style={mediaStyle} />}

			{showMedia && !activated && (
				<VideoPoster thumbnailUrl={thumbnailUrl} style={mediaStyle} onPlay={handlePlay} disablePlay={isSending} isSending={isSending} />
			)}

			{shouldRenderVideo && (
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
						className="group-hover:flex hidden top-2 right-1 cursor-pointer absolute bg-bgSurface rounded-md w-6 h-6  items-center justify-center z-30"
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

function MessageVideo(props: MessageImage) {
	if (isElectronMac()) {
		return <MacElectronVideo {...props} />;
	}
	return <DefaultVideo {...props} />;
}

export default MessageVideo;
