import {
	liveStreamActions,
	selectAllAccount,
	selectLivePhase,
	selectLiveSources,
	selectMemberClanByUserId,
	selectStreamMembersByChannelId,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
import { getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import type { PointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { SFU_CONTROL_BUTTON_CLASS } from '../../MezonSfuVoiceChannel/ControlBar/controlStyles';
import type { StreamPublisherInfo } from '../StreamPublisher';
import { StreamLiveBadge, StreamPublisherAvatar, StreamViewerCount, StreamViewers } from '../StreamPublisher';
import { getLiveSession, subscribeLiveSession } from './liveSessionHolder';
import { requestDisplayMedia } from './mixer';

const CONTROLS_HIDE_DELAY_MS = 3000;
const CONTROL_BUTTON_CLASS = 'flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white';

function isPickerCancelled(error: unknown): boolean {
	const name = (error as DOMException | undefined)?.name;
	return name === 'NotAllowedError' || name === 'AbortError';
}

export type LivePublisherStageProps = {
	channelId: string;
};

export function LivePublisherStage({ channelId }: LivePublisherStageProps) {
	const { t } = useTranslation('channelStream');
	const dispatch = useAppDispatch();
	const phase = useSelector(selectLivePhase);
	const sources = useSelector(selectLiveSources);
	const account = useSelector(selectAllAccount);
	const myUserId = account?.user?.id ?? '';
	const myMember = useAppSelector((state) => selectMemberClanByUserId(state, myUserId));
	const listedViewers = useAppSelector((state) => Math.max(0, selectStreamMembersByChannelId(state, channelId).length - 1));

	const stageRef = useRef<HTMLDivElement>(null);
	const previewContainerRef = useRef<HTMLDivElement>(null);
	const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();

	const [idle, setIdle] = useState(false);
	const [controlsHovered, setControlsHovered] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showMembers, setShowMembers] = useState(true);

	const canShareScreen = useMemo(() => typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function', []);

	const selfPublisher = useMemo<StreamPublisherInfo>(
		() => ({
			userId: myUserId,
			name:
				getNameForPrioritize(
					myMember?.clan_nick,
					myMember?.user?.display_name || account?.user?.display_name,
					myMember?.user?.username || account?.user?.username
				) || '',
			avatar: getAvatarForPrioritize(myMember?.clan_avatar, myMember?.user?.avatar_url || account?.user?.avatar_url) || ''
		}),
		[account?.user?.avatar_url, account?.user?.display_name, account?.user?.username, myMember, myUserId]
	);

	const statusText = useMemo(() => {
		if (phase === 'starting') return t('liveConnecting');
		if (phase === 'reconnecting') return t('liveReconnecting');
		return '';
	}, [phase, t]);

	const controlsVisible = !idle || controlsHovered;
	const membersLabel = useMemo(() => (showMembers ? t('hideMembers') : t('showMembers')), [showMembers, t]);
	const micTitle = useMemo(() => t('liveMic'), [t]);
	const cameraTitle = useMemo(() => t('liveCamera'), [t]);
	const systemAudioTitle = useMemo(() => t('liveSystemAudio'), [t]);
	const screenTitle = useMemo(() => (sources.screenOn ? t('changeScreen') : t('shareScreen')), [sources.screenOn, t]);
	const stopScreenTitle = useMemo(() => t('stopScreen'), [t]);
	const endLiveTitle = useMemo(() => t('endLive'), [t]);
	const fullscreenTitle = useMemo(() => (isFullscreen ? t('exitFullscreen') : t('fullscreen')), [isFullscreen, t]);

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

	useEffect(() => {
		const mountCanvas = () => {
			const container = previewContainerRef.current;
			const canvas = getLiveSession()?.compositor.canvas;
			if (!container || !canvas) return;
			canvas.className = 'w-full h-full object-contain';
			if (canvas.parentElement !== container) {
				container.replaceChildren(canvas);
			}
		};
		mountCanvas();
		const unsubscribe = subscribeLiveSession(mountCanvas);
		const currentContainer = previewContainerRef.current;
		return () => {
			unsubscribe();
			const canvas = getLiveSession()?.compositor.canvas;
			if (canvas && canvas.parentElement === currentContainer) {
				canvas.remove();
			}
		};
	}, []);

	const handlePointerLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== 'mouse') return;
		clearTimeout(idleTimerRef.current);
		setIdle(true);
	}, []);

	const handleControlsEnter = useCallback(() => {
		setControlsHovered(true);
	}, []);

	const handleControlsLeave = useCallback(() => {
		setControlsHovered(false);
	}, []);

	const handleToggleFullscreen = useCallback(() => {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => undefined);
		} else {
			void stageRef.current?.requestFullscreen().catch(() => undefined);
		}
	}, []);

	const handleToggleMic = useCallback(() => {
		getLiveSession()?.setMic(!sources.micOn);
	}, [sources.micOn]);

	const handleToggleCamera = useCallback(() => {
		getLiveSession()?.setCamera(!sources.cameraOn);
	}, [sources.cameraOn]);

	const handleToggleSystemAudio = useCallback(() => {
		getLiveSession()?.setSystemAudio(!sources.systemAudioOn);
	}, [sources.systemAudioOn]);

	const handleShareOrChangeScreen = useCallback(() => {
		if (!canShareScreen) return;
		const promise = requestDisplayMedia(true);
		void promise
			.then((stream) => {
				const session = getLiveSession();
				if (!session) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					return;
				}
				session.setScreen(stream);
			})
			.catch((err: unknown) => {
				if (isPickerCancelled(err)) return;
				dispatch(
					toastActions.addToast({
						message: t('liveError.source', { source: t('liveScreen') }),
						type: 'error',
						autoClose: 5000
					})
				);
			});
	}, [canShareScreen, dispatch, t]);

	const handleStopScreen = useCallback(() => {
		getLiveSession()?.setScreen(null);
	}, []);

	const handleEndLive = useCallback(() => {
		dispatch(liveStreamActions.requestStop('user'));
	}, [dispatch]);

	const handleToggleMembers = useCallback(() => {
		setShowMembers((shown) => !shown);
	}, []);

	return (
		<div className="flex h-full w-full flex-col p-4 dark:bg-[var(--theme-setting-primary)] max-md:p-2">
			<div className="min-h-0 flex-1">
				<div
					ref={stageRef}
					className={`relative h-full w-full overflow-hidden bg-black ${isFullscreen ? '' : 'rounded-xl'} ${controlsVisible ? '' : 'cursor-none'}`}
					onPointerMove={wake}
					onPointerDown={wake}
					onPointerLeave={handlePointerLeave}
				>
					<div ref={previewContainerRef} className="h-full w-full" onDoubleClick={handleToggleFullscreen} />
					<div
						className={`pointer-events-none absolute inset-x-0 top-0 flex min-w-0 items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-3 text-white transition-opacity duration-200 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
					>
						<StreamPublisherAvatar publisher={selfPublisher} className="!size-7 !min-w-7" classNameText="!text-xs" />
						<span className="truncate font-semibold">{selfPublisher.name}</span>
						<StreamLiveBadge />
						<StreamViewerCount channelId={channelId} className="text-white/90" />
						{statusText && <span className="rounded bg-black/50 px-2 py-0.5 text-xs text-white/90">{statusText}</span>}
					</div>
					<div
						className={`absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-white transition-opacity duration-200 max-md:px-2 max-md:pb-2 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
						onPointerEnter={handleControlsEnter}
						onPointerLeave={handleControlsLeave}
					>
						<div />
						<div className="flex items-center justify-center gap-3 max-md:gap-2">
							<button
								type="button"
								title={micTitle}
								aria-label={micTitle}
								aria-pressed={sources.micOn}
								onClick={handleToggleMic}
								className={`${SFU_CONTROL_BUTTON_CLASS} ${sources.micOn ? '' : '!bg-zinc-800 text-red-400'}`}
							>
								<MezonIcon icon={sources.micOn ? MzIcons24.mzMic : MzIcons24.mzMicOff} />
							</button>
							<button
								type="button"
								title={cameraTitle}
								aria-label={cameraTitle}
								aria-pressed={sources.cameraOn}
								onClick={handleToggleCamera}
								className={`${SFU_CONTROL_BUTTON_CLASS} ${sources.cameraOn ? '!bg-[#3B82F6] hover:!bg-[#2563EB]' : ''}`}
							>
								<MezonIcon icon={sources.cameraOn ? MzIcons24.mzCamera : MzIcons24.mzCameraOff} />
							</button>
							{sources.hasSystemAudio && (
								<button
									type="button"
									title={systemAudioTitle}
									aria-label={systemAudioTitle}
									aria-pressed={sources.systemAudioOn}
									onClick={handleToggleSystemAudio}
									className={`${SFU_CONTROL_BUTTON_CLASS} ${sources.systemAudioOn ? '!bg-[#3B82F6] hover:!bg-[#2563EB]' : ''}`}
								>
									<MezonIcon icon={sources.systemAudioOn ? MzIcons24.mzSpeaker : MzIcons24.mzSpeakerOff} />
								</button>
							)}
							{canShareScreen && (
								<button
									type="button"
									title={screenTitle}
									aria-label={screenTitle}
									onClick={handleShareOrChangeScreen}
									className={`${SFU_CONTROL_BUTTON_CLASS} ${sources.screenOn ? '!bg-[#3B82F6] hover:!bg-[#2563EB]' : ''}`}
								>
									<MezonIcon icon={MzIcons24.mzScreenShare} />
								</button>
							)}
							{sources.screenOn && (
								<button
									type="button"
									title={stopScreenTitle}
									aria-label={stopScreenTitle}
									onClick={handleStopScreen}
									className={SFU_CONTROL_BUTTON_CLASS}
								>
									<MezonIcon icon={MzIcons24.mzScreenShareOff} />
								</button>
							)}
							<button
								type="button"
								title={endLiveTitle}
								aria-label={endLiveTitle}
								onClick={handleEndLive}
								className={`${SFU_CONTROL_BUTTON_CLASS} !bg-[#da373c] hover:!bg-[#a12829]`}
							>
								<MezonIcon icon={MzIcons24.mzCallEnd} />
							</button>
						</div>
						<div className="flex min-w-0 items-center justify-end gap-1">
							<button
								type="button"
								className={CONTROL_BUTTON_CLASS}
								title={fullscreenTitle}
								aria-label={fullscreenTitle}
								onClick={handleToggleFullscreen}
							>
								<MezonIcon icon={isFullscreen ? MzIcons20.mzFullscreenExit : MzIcons20.mzFullscreen} />
							</button>
						</div>
					</div>
				</div>
			</div>
			{listedViewers > 0 && (
				<div className="flex shrink-0 flex-col items-center gap-2 pt-2">
					<button
						type="button"
						title={membersLabel}
						aria-label={membersLabel}
						aria-expanded={showMembers}
						onClick={handleToggleMembers}
						className="flex items-center gap-1 rounded-3xl bg-neutral-700 px-2 py-[6px] text-white hover:bg-bgSecondary600"
					>
						<MezonIcon icon={MzIcons20.mzChevronDown} className={`transition-all duration-300 ${showMembers ? '' : '-rotate-180'}`} />
						<MezonIcon icon={MzIcons20.mzMembers} />
					</button>
					{showMembers && <StreamViewers channelId={channelId} />}
				</div>
			)}
		</div>
	);
}
