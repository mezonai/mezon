import {
	liveStreamActions,
	selectCurrentClanId,
	selectLivePhase,
	selectLiveSources,
	selectStreamMembersByChannelId,
	selectStreamViewerCount,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { IconData } from '@mezon/ui';
import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { ensureMediaPermission } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LiveCommentInput, LiveCommentStack, useStreamComments } from '../../LiveComments';
import { VoiceChannelUsers } from '../../MezonSfuVoiceChannel/PreJoinVoiceChannel/VoiceChannelUsers/VoiceChannelUsers';
import { StreamLiveBadge } from '../StreamPublisher';
import { getLiveSession, subscribeLiveSession } from './liveSessionHolder';
import { requestDisplayMedia } from './mixer';

function isPickerCancelled(error: unknown): boolean {
	const name = (error as DOMException | undefined)?.name;
	return name === 'NotAllowedError' || name === 'AbortError';
}

type LiveControlButtonProps = {
	icon: IconData;
	active: boolean;
	label: string;
	onClick: () => void;
};

function LiveControlButton({ icon, active, label, onClick }: LiveControlButtonProps) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={active}
			onClick={onClick}
			className={`flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.22] ${
				active ? 'bg-white/15' : 'bg-white/[0.08]'
			}`}
		>
			<MezonIcon icon={icon} />
		</button>
	);
}

export type LivePublisherStageProps = {
	channelId: string;
	clanId?: string;
};

export function LivePublisherStage({ channelId, clanId }: LivePublisherStageProps) {
	const { t } = useTranslation(['channelStream', 'channelVoice']);
	const dispatch = useAppDispatch();
	const phase = useSelector(selectLivePhase);
	const sources = useSelector(selectLiveSources);
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
	const members = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));
	const viewerCount = useAppSelector((state) => selectStreamViewerCount(state, channelId));

	const stageRef = useRef<HTMLDivElement>(null);
	const previewContainerRef = useRef<HTMLDivElement>(null);
	const sendSeqRef = useRef(0);
	const [showMembers, setShowMembers] = useState(true);
	const [showCommentInput, setShowCommentInput] = useState(false);
	const [commentDraft, setCommentDraft] = useState('');
	const [sendingComment, setSendingComment] = useState(false);

	useEffect(() => {
		sendSeqRef.current += 1;
		setShowCommentInput(false);
		setCommentDraft('');
		setSendingComment(false);
		return () => {
			sendSeqRef.current += 1;
		};
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

	const handleToggleComment = useCallback(() => {
		if (commentsHidden) {
			showComments();
			setShowCommentInput(true);
			return;
		}
		setShowCommentInput((prev) => !prev);
	}, [commentsHidden, showComments]);

	const handleSendComment = useCallback(() => {
		if (sendingComment || !commentDraft.trim()) return;
		const seq = ++sendSeqRef.current;
		setSendingComment(true);
		void sendComment(commentDraft).then((sent) => {
			if (sendSeqRef.current !== seq) return;
			setSendingComment(false);
			if (sent) setCommentDraft('');
		});
	}, [commentDraft, sendComment, sendingComment]);

	const canShareScreen = useMemo(() => typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function', []);

	const statusText = useMemo(() => {
		if (phase === 'starting') return t('liveConnecting');
		if (phase === 'reconnecting') return t('liveReconnecting');
		return '';
	}, [phase, t]);

	const hasMembers = members.length > 0;
	const viewerCountText = useMemo(() => t('viewerCount', { count: viewerCount }), [t, viewerCount]);
	const membersLabel = useMemo(() => (showMembers ? t('hideMembers') : t('showMembers')), [showMembers, t]);
	const micTitle = useMemo(() => t('liveMic'), [t]);
	const cameraTitle = useMemo(() => t('liveCamera'), [t]);
	const systemAudioTitle = useMemo(() => t('liveSystemAudio'), [t]);
	const screenTitle = useMemo(() => (sources.screenOn ? t('changeScreen') : t('shareScreen')), [sources.screenOn, t]);
	const stopScreenTitle = useMemo(() => t('stopScreen'), [t]);
	const endLiveTitle = useMemo(() => t('endLive'), [t]);

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

	const handleToggleFullscreen = useCallback(() => {
		if (document.fullscreenElement) {
			void document.exitFullscreen().catch(() => undefined);
		} else {
			void stageRef.current?.requestFullscreen().catch(() => undefined);
		}
	}, []);

	const handleToggleMic = useCallback(async () => {
		const next = !sources.micOn;
		if (next && !(await ensureMediaPermission('microphone'))) return;
		getLiveSession()?.setMic(next);
	}, [sources.micOn]);

	const handleToggleCamera = useCallback(async () => {
		const next = !sources.cameraOn;
		if (next && !(await ensureMediaPermission('camera'))) return;
		getLiveSession()?.setCamera(next);
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
				<div ref={stageRef} className="relative h-full w-full overflow-hidden rounded-xl bg-black">
					<div ref={previewContainerRef} className="h-full w-full" onDoubleClick={handleToggleFullscreen} />
					<div className="pointer-events-none absolute inset-x-0 top-0 flex min-w-0 items-center gap-2 bg-gradient-to-b from-black/60 to-transparent px-4 pb-10 pt-3">
						<StreamLiveBadge />
						<span className="flex shrink-0 items-center gap-1 text-sm text-white/90">
							<MezonIcon icon={MzIcons16.mzEye} />
							{viewerCountText}
						</span>
					</div>
					{statusText && (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span className="rounded-lg bg-black/70 px-4 py-2 text-sm font-medium text-white">{statusText}</span>
						</div>
					)}
					{showLiveCommentOverlay && (
						<div className="pointer-events-none absolute bottom-20 right-4 z-30 flex w-[320px] max-w-[calc(100%-2rem)] flex-col items-end gap-2">
							{!commentsHidden && (
								<LiveCommentStack comments={liveComments} onHide={hideComments} labels={commentStackLabels} className="w-full" />
							)}
							{showCommentInput && (
								<LiveCommentInput
									value={commentDraft}
									onChange={setCommentDraft}
									onSend={handleSendComment}
									placeholder={commentPlaceholder}
									sendLabel={commentSendLabel}
									disabled={sendingComment}
									autoFocus
									className="w-full"
								/>
							)}
						</div>
					)}
					<div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 max-md:px-2 max-md:pb-2">
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<LiveControlButton
								icon={sources.micOn ? MzIcons20.mzMic : MzIcons20.mzMicOff}
								active={sources.micOn}
								label={micTitle}
								onClick={handleToggleMic}
							/>
							<LiveControlButton
								icon={sources.cameraOn ? MzIcons20.mzVideo : MzIcons20.mzVideoOff}
								active={sources.cameraOn}
								label={cameraTitle}
								onClick={handleToggleCamera}
							/>
							{sources.hasSystemAudio && (
								<LiveControlButton
									icon={sources.systemAudioOn ? MzIcons20.mzSpeaker : MzIcons20.mzSpeakerOff}
									active={sources.systemAudioOn}
									label={systemAudioTitle}
									onClick={handleToggleSystemAudio}
								/>
							)}
							{canShareScreen && (
								<LiveControlButton
									icon={MzIcons20.mzScreenShare}
									active={sources.screenOn}
									label={screenTitle}
									onClick={handleShareOrChangeScreen}
								/>
							)}
							{sources.screenOn && (
								<LiveControlButton
									icon={MzIcons20.mzScreenShareOff}
									active={false}
									label={stopScreenTitle}
									onClick={handleStopScreen}
								/>
							)}
							<button
								type="button"
								title={commentButtonLabel}
								aria-label={commentButtonLabel}
								aria-pressed={showCommentInput}
								onClick={handleToggleComment}
								className={`relative flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.22] ${
									showCommentInput ? 'bg-white/15' : 'bg-white/[0.08]'
								}`}
							>
								<MezonIcon icon={MzIcons20.mzMessageAdd} />
								{showCommentDot && <span className="btn-primary absolute right-1.5 top-1.5 size-2 rounded-full" />}
							</button>
						</div>
						<button
							type="button"
							onClick={handleEndLive}
							className="flex shrink-0 items-center gap-2 rounded-full bg-[#da373c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a12829]"
						>
							<MezonIcon icon={MzIcons20.mzCallEnd} />
							{endLiveTitle}
						</button>
					</div>
				</div>
			</div>
			{hasMembers && (
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
					{showMembers && <VoiceChannelUsers voiceChannelMembers={members} total={members.length} />}
				</div>
			)}
		</div>
	);
}
