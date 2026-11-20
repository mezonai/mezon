import type { StreamQuality } from '@mezon/store';
import {
	STREAM_QUALITIES,
	selectCurrentClanId,
	selectStreamMuted,
	selectStreamQuality,
	selectStreamVolume,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store';
import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LiveCommentInput, LiveCommentStack, useStreamComments } from '../LiveComments';
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
	clanId?: string;
	poster: string;
	onLeave: () => void;
};

export function StreamStage({ channelId, clanId, poster, onLeave }: StreamStageProps) {
	const { t } = useTranslation(['channelStream', 'channelVoice']);
	const dispatch = useAppDispatch();
	const volume = useSelector(selectStreamVolume);
	const muted = useSelector(selectStreamMuted);
	const quality = useSelector(selectStreamQuality);
	const fallbackClanId = useSelector(selectCurrentClanId);
	const resolvedClanId = clanId || fallbackClanId || '';
	const {
		comments: liveComments,
		hidden: commentsHidden,
		hasUnseen: hasUnseenComments,
		hide: hideComments,
		show: showComments,
		sendComment
	} = useStreamComments(channelId, resolvedClanId);
	const publisher = useStreamPublisher(channelId);
	const stageRef = useRef<HTMLDivElement>(null);
	const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
	const [idle, setIdle] = useState(false);
	const [controlsHovered, setControlsHovered] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showCommentInput, setShowCommentInput] = useState(false);
	const controlsVisible = !idle || controlsHovered || menuOpen || showCommentInput;
	const silent = muted || volume === 0;

	useEffect(() => {
		setShowCommentInput(false);
	}, [channelId]);

	const commentStackLabels = useMemo(() => ({ hide: t('channelVoice:comment.hide') }), [t]);
	const commentPlaceholder = useMemo(() => t('channelVoice:comment.placeholder'), [t]);
	const commentButtonLabel = useMemo(
		() => (commentsHidden ? t('channelVoice:comment.show') : t('channelVoice:comment.button')),
		[commentsHidden, t]
	);
	const commentSendLabel = useMemo(() => t('channelVoice:comment.button'), [t]);
	const showCommentDot = commentsHidden && hasUnseenComments;
	const showLiveCommentOverlay = !commentsHidden || showCommentInput;
	const commentOverlayPositionClass = controlsVisible ? 'bottom-20' : 'bottom-4';

	const handleToggleComment = useCallback(() => {
		if (commentsHidden) {
			showComments();
			setShowCommentInput(true);
			return;
		}
		setShowCommentInput((prev) => !prev);
	}, [commentsHidden, showComments]);

	const handleSendComment = useCallback((text: string) => sendComment(text), [sendComment]);

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
			{showLiveCommentOverlay && (
				<div
					className={`pointer-events-none absolute right-4 z-30 flex w-[320px] max-w-[calc(100%-2rem)] flex-col items-end gap-2 transition-[bottom] duration-200 ${commentOverlayPositionClass}`}
				>
					{!commentsHidden && (
						<LiveCommentStack comments={liveComments} onHide={hideComments} labels={commentStackLabels} className="w-full" />
					)}
					{showCommentInput && (
						<LiveCommentInput
							key={channelId}
							onSend={handleSendComment}
							placeholder={commentPlaceholder}
							sendLabel={commentSendLabel}
							autoFocus
							className="w-full"
						/>
					)}
				</div>
			)}
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
							<MezonIcon icon={MzIcons20.mzSpeakerOff} />
						) : volume < 0.5 ? (
							<MezonIcon icon={MzIcons20.mzSpeakerLow} />
						) : (
							<MezonIcon icon={MzIcons20.mzSpeaker} />
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
					<button
						type="button"
						className={`relative ${CONTROL_BUTTON_CLASS} ${showCommentInput ? 'bg-white/15 text-white' : ''}`}
						title={commentButtonLabel}
						aria-label={commentButtonLabel}
						aria-pressed={showCommentInput}
						onClick={handleToggleComment}
					>
						<MezonIcon icon={MzIcons20.mzMessageAdd} />
						{showCommentDot && <span className="btn-primary absolute right-1.5 top-1.5 size-2 rounded-full" />}
					</button>
				</div>
				<button
					type="button"
					title={t('channelVoice:disconnect')}
					aria-label={t('channelVoice:disconnect')}
					className={`${SFU_CONTROL_BUTTON_CLASS} !bg-[#da373c] hover:!bg-[#a12829]`}
					onClick={onLeave}
					data-e2e={generateE2eId('icon.end_call')}
				>
					<MezonIcon icon={MzIcons24.mzCallEnd} />
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
						{isFullscreen ? <MezonIcon icon={MzIcons20.mzFullscreenExit} /> : <MezonIcon icon={MzIcons20.mzFullscreen} />}
					</button>
				</div>
			</div>
		</div>
	);
}
