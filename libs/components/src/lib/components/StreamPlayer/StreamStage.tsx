import type { StreamQuality } from '@mezon/store';
import { STREAM_QUALITIES, selectStreamMuted, selectStreamQuality, selectStreamVolume, useAppDispatch, videoStreamActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { SFU_CONTROL_BUTTON_CLASS } from '../MezonSfuVoiceChannel/ControlBar/controlStyles';
import { StreamMenu } from './StreamMenu';
import { StreamOutputDeviceMenu } from './StreamOutputDeviceMenu';
import { StreamLiveBadge, StreamPublisherAvatar, StreamViewerCount, useStreamPublisher } from './StreamPublisher';
import { StreamVideoBuffering, StreamVideoSlot } from './StreamVideoSlot';

const CONTROLS_HIDE_DELAY_MS = 3000;
const CONTROL_BUTTON_CLASS = 'flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white';

export const STREAM_QUALITY_LABEL_KEYS: Record<StreamQuality, string> = {
	auto: 'channelStream:qualityAuto',
	high: 'channelStream:qualityHigh',
	mid: 'channelStream:qualityMid',
	low: 'channelStream:qualityLow'
};

type StreamStageProps = {
	channelId: string;
	poster: string;
	onLeave: () => void;
};

export function StreamStage({ channelId, poster, onLeave }: StreamStageProps) {
	const { t } = useTranslation(['channelStream', 'channelVoice']);
	const dispatch = useAppDispatch();
	const volume = useSelector(selectStreamVolume);
	const muted = useSelector(selectStreamMuted);
	const quality = useSelector(selectStreamQuality);
	const publisher = useStreamPublisher(channelId);
	const stageRef = useRef<HTMLDivElement>(null);
	const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
	const [idle, setIdle] = useState(false);
	const [controlsHovered, setControlsHovered] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const controlsVisible = !idle || controlsHovered || menuOpen;
	const silent = muted || volume === 0;

	const qualityOptions = useMemo(() => STREAM_QUALITIES.map((id) => ({ id, label: t(STREAM_QUALITY_LABEL_KEYS[id]) })), [t]);

	const wake = useCallback(() => {
		setIdle(false);
		clearTimeout(idleTimerRef.current);
		idleTimerRef.current = setTimeout(() => setIdle(true), CONTROLS_HIDE_DELAY_MS);
	}, []);

	useEffect(() => {
		wake();
		return () => clearTimeout(idleTimerRef.current);
	}, [wake]);

	useEffect(() => {
		const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
	}, []);

	const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== 'mouse') return;
		clearTimeout(idleTimerRef.current);
		setIdle(true);
	};

	const toggleFullscreen = () => {
		if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
		else void stageRef.current?.requestFullscreen().catch(() => undefined);
	};

	const toggleMute = () => {
		if (!silent) {
			dispatch(videoStreamActions.setMuted(true));
			return;
		}
		dispatch(videoStreamActions.setMuted(false));
		if (volume === 0) dispatch(videoStreamActions.setVolume(0.5));
	};

	const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
		const next = Number(event.target.value);
		dispatch(videoStreamActions.setVolume(next));
		if (muted && next > 0) dispatch(videoStreamActions.setMuted(false));
	};

	const handleQualityChange = useCallback((id: string) => dispatch(videoStreamActions.setQuality(id as StreamQuality)), [dispatch]);

	return (
		<div
			ref={stageRef}
			className={`relative h-full w-full overflow-hidden bg-black ${isFullscreen ? '' : 'rounded-xl'} ${controlsVisible ? '' : 'cursor-none'}`}
			onPointerMove={wake}
			onPointerDown={wake}
			onPointerLeave={handlePointerLeave}
		>
			<div className="h-full w-full" onDoubleClick={toggleFullscreen}>
				<StreamVideoSlot poster={poster} />
			</div>
			<StreamVideoBuffering />
			<div
				className={`pointer-events-none absolute inset-x-0 top-0 flex min-w-0 items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-3 text-white transition-opacity duration-200 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
			>
				{publisher && (
					<>
						<StreamPublisherAvatar publisher={publisher} className="!size-7 !min-w-7" classNameText="!text-xs" />
						<span className="truncate font-semibold">{publisher.name}</span>
					</>
				)}
				<StreamLiveBadge />
				<StreamViewerCount channelId={channelId} className="text-white/90" />
			</div>
			<div
				className={`absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-white transition-opacity duration-200 max-md:px-2 max-md:pb-2 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
				onPointerEnter={() => setControlsHovered(true)}
				onPointerLeave={() => setControlsHovered(false)}
			>
				<div className="flex min-w-0 items-center gap-1">
					<button
						type="button"
						className={CONTROL_BUTTON_CLASS}
						title={silent ? t('unmute') : t('mute')}
						aria-label={silent ? t('unmute') : t('mute')}
						onClick={toggleMute}
					>
						{silent ? (
							<Icons.MutedVolume defaultFill1="currentColor" className="h-5 w-5" />
						) : volume < 0.5 ? (
							<Icons.LowVolume defaultFill1="currentColor" defaultFill2="currentColor" className="h-5 w-5" />
						) : (
							<Icons.LoudVolume defaultFill1="currentColor" defaultFill2="currentColor" className="h-5 w-5" />
						)}
					</button>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={muted ? 0 : volume}
						onChange={handleVolumeChange}
						aria-label={t('volume')}
						className="h-1 w-24 cursor-pointer accent-white max-sm:hidden"
					/>
				</div>
				<button
					type="button"
					title={t('channelVoice:disconnect')}
					aria-label={t('channelVoice:disconnect')}
					className={`${SFU_CONTROL_BUTTON_CLASS} !bg-[#da373c] hover:!bg-[#a12829]`}
					onClick={onLeave}
				>
					<Icons.EndCall className="h-6 w-6" />
				</button>
				<div className="flex min-w-0 items-center justify-end gap-1">
					<StreamMenu
						label={t('quality')}
						trigger={<span className="text-sm font-medium">{t(STREAM_QUALITY_LABEL_KEYS[quality])}</span>}
						options={qualityOptions}
						selectedId={quality}
						onSelect={handleQualityChange}
						onOpenChange={setMenuOpen}
					/>
					<StreamOutputDeviceMenu onOpenChange={setMenuOpen} />
					<button
						type="button"
						className={CONTROL_BUTTON_CLASS}
						title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
						aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
						onClick={toggleFullscreen}
					>
						{isFullscreen ? <Icons.ExitFullScreen className="h-5 w-5" /> : <Icons.FullScreen className="h-5 w-5" />}
					</button>
				</div>
			</div>
		</div>
	);
}
