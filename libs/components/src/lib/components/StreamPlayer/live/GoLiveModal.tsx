import {
	liveStreamActions,
	selectCurrentStreamInfo,
	selectIsJoin,
	toastActions,
	useAppDispatch,
	videoStreamActions,
	watchStream
} from '@mezon/store';
import type { IconData } from '@mezon/ui';
import { MezonIcon, Modal, MzIcons20 } from '@mezon/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { setPendingLiveCapture } from './liveSessionHolder';
import { openLiveCameraStream, openLiveMicStream, requestDisplayMedia } from './mixer';

type GoLiveToggleRowProps = {
	id: string;
	icon: IconData;
	label: string;
	hint?: string;
	checked: boolean;
	disabled?: boolean;
	indented?: boolean;
	onToggle: () => void;
};

function GoLiveToggleRow({ id, icon, label, hint, checked, disabled = false, indented = false, onToggle }: GoLiveToggleRowProps) {
	return (
		<div className={`flex items-start justify-between gap-3 rounded-lg bg-item-theme px-3 py-2.5 ${indented ? 'ml-6' : ''}`}>
			<label htmlFor={id} className={`flex min-w-0 flex-1 items-start gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
				<MezonIcon icon={icon} className="mt-0.5 shrink-0 text-[var(--mz-icon)]" />
				<span className="flex min-w-0 flex-col">
					<span className="text-sm font-medium text-theme-primary-active">{label}</span>
					{hint && <span className="text-xs text-theme-primary">{hint}</span>}
				</span>
			</label>
			<button
				id={id}
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={label}
				disabled={disabled}
				onClick={onToggle}
				className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
					checked ? 'bg-green-600' : 'bg-zinc-600'
				}`}
			>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
						checked ? 'translate-x-6' : 'translate-x-1'
					}`}
				/>
			</button>
		</div>
	);
}

export type GoLiveModalProps = {
	showModal: boolean;
	onClose: () => void;
	clanId: string;
	clanName: string;
	channelId: string;
	channelLabel: string;
	parentId: string;
};

function stopStreamTracks(stream: MediaStream | null): void {
	if (!stream) return;
	for (const track of stream.getTracks()) {
		track.stop();
	}
}

function isPickerCancelled(error: unknown): boolean {
	const name = (error as DOMException | undefined)?.name;
	return name === 'NotAllowedError' || name === 'AbortError';
}

export function GoLiveModal({ showModal, onClose, clanId, clanName, channelId, channelLabel, parentId }: GoLiveModalProps) {
	const { t } = useTranslation(['channelStream', 'common']);
	const dispatch = useAppDispatch();
	const isJoin = useSelector(selectIsJoin);
	const currentStreamInfo = useSelector(selectCurrentStreamInfo);

	const canShareScreen = useMemo(() => typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function', []);

	const [screenOn, setScreenOn] = useState<boolean>(canShareScreen);
	const [systemAudioOn, setSystemAudioOn] = useState<boolean>(true);
	const [micOn, setMicOn] = useState<boolean>(true);
	const [cameraOn, setCameraOn] = useState<boolean>(!canShareScreen);
	const [submitting, setSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (!showModal) return;
		setScreenOn(canShareScreen);
		setSystemAudioOn(true);
		setMicOn(true);
		setCameraOn(!canShareScreen);
		setSubmitting(false);
	}, [canShareScreen, showModal]);

	const handleToggleScreen = useCallback(() => {
		setScreenOn((prev) => !prev);
	}, []);

	const handleToggleSystemAudio = useCallback(() => {
		setSystemAudioOn((prev) => !prev);
	}, []);

	const handleToggleMic = useCallback(() => {
		setMicOn((prev) => !prev);
	}, []);

	const handleToggleCamera = useCallback(() => {
		setCameraOn((prev) => !prev);
	}, []);

	const effectiveScreenOn = canShareScreen && screenOn;
	const canStart = (effectiveScreenOn || cameraOn) && !submitting;
	const modalTitle = useMemo(() => t('goLiveTitle', { channel: channelLabel }), [channelLabel, t]);
	const cancelLabel = useMemo(() => t('common:cancel', { defaultValue: 'Cancel' }), [t]);
	const startLabel = useMemo(() => t('startLive'), [t]);
	const shareScreenLabel = useMemo(() => t('shareScreen'), [t]);
	const systemAudioLabel = useMemo(() => t('liveSystemAudio'), [t]);
	const systemAudioHint = useMemo(() => t('systemAudioHint'), [t]);
	const micLabel = useMemo(() => t('liveMic'), [t]);
	const cameraLabel = useMemo(() => t('liveCamera'), [t]);
	const systemAudioDisabled = !effectiveScreenOn || submitting;

	const handleStart = useCallback(async () => {
		if (!canStart) return;
		setSubmitting(true);

		const wantScreen = canShareScreen && screenOn;
		const wantSystemAudio = wantScreen && systemAudioOn;
		const screenPromise = wantScreen ? requestDisplayMedia(wantSystemAudio) : null;

		let audioContext: AudioContext | null = null;
		try {
			audioContext = new AudioContext({ latencyHint: 'interactive' });
			void Promise.resolve(audioContext.resume()).catch(() => undefined);
		} catch {
			audioContext = null;
		}

		if (!audioContext) {
			if (screenPromise) {
				void screenPromise.then((s) => stopStreamTracks(s)).catch(() => undefined);
			}
			setSubmitting(false);
			dispatch(toastActions.addToast({ message: t('liveError.unsupported'), type: 'error', autoClose: 5000 }));
			return;
		}

		let screenStream: MediaStream | null = null;
		if (screenPromise) {
			try {
				screenStream = await screenPromise;
				if (!screenStream.getVideoTracks()[0]) {
					stopStreamTracks(screenStream);
					screenStream = null;
					dispatch(
						toastActions.addToast({
							message: t('liveError.source', { source: t('liveScreen') }),
							type: 'error',
							autoClose: 5000
						})
					);
				}
			} catch (err) {
				if (isPickerCancelled(err)) {
					void Promise.resolve(audioContext.close()).catch(() => undefined);
					setSubmitting(false);
					onClose();
					return;
				}
				screenStream = null;
				dispatch(
					toastActions.addToast({
						message: t('liveError.source', { source: t('liveScreen') }),
						type: 'error',
						autoClose: 5000
					})
				);
			}
		}

		let cameraStream: MediaStream | null = null;
		if (cameraOn) {
			try {
				cameraStream = await openLiveCameraStream();
			} catch {
				cameraStream = null;
				dispatch(
					toastActions.addToast({
						message: t('liveError.source', { source: t('liveCamera') }),
						type: 'error',
						autoClose: 5000
					})
				);
			}
		}

		if (!screenStream && !cameraStream) {
			void Promise.resolve(audioContext.close()).catch(() => undefined);
			setSubmitting(false);
			return;
		}

		let micStream: MediaStream | null = null;
		if (micOn) {
			try {
				micStream = await openLiveMicStream();
			} catch {
				micStream = null;
				dispatch(
					toastActions.addToast({
						message: t('liveError.source', { source: t('liveMic') }),
						type: 'error',
						autoClose: 5000
					})
				);
			}
		}

		if (isJoin && currentStreamInfo?.streamId === channelId) {
			void dispatch(watchStream({ channelId, watching: false }));
			dispatch(videoStreamActions.resetPlayback());
		}

		const hasSystemAudio = Boolean(screenStream?.getAudioTracks()[0]);
		setPendingLiveCapture({
			clanId,
			channelId,
			screen: screenStream,
			camera: cameraStream,
			mic: micStream,
			audioContext,
			systemAudioOn: wantSystemAudio
		});
		dispatch(
			liveStreamActions.starting({
				clanId,
				channelId,
				channelLabel,
				clanName,
				parentId,
				screenOn: Boolean(screenStream),
				cameraOn: Boolean(cameraStream),
				micOn: Boolean(micStream),
				systemAudioOn: Boolean(wantSystemAudio && hasSystemAudio),
				hasSystemAudio
			})
		);
		setSubmitting(false);
		onClose();
	}, [
		cameraOn,
		canShareScreen,
		canStart,
		channelId,
		channelLabel,
		clanId,
		clanName,
		currentStreamInfo?.streamId,
		dispatch,
		isJoin,
		micOn,
		onClose,
		parentId,
		screenOn,
		systemAudioOn,
		t
	]);

	return (
		<Modal showModal={showModal} onClose={onClose} title={modalTitle} isInviteModal>
			<div className="flex flex-col gap-3">
				{canShareScreen && (
					<>
						<GoLiveToggleRow
							id="go-live-screen"
							icon={MzIcons20.mzScreenShare}
							label={shareScreenLabel}
							checked={screenOn}
							disabled={submitting}
							onToggle={handleToggleScreen}
						/>
						<GoLiveToggleRow
							id="go-live-system-audio"
							icon={MzIcons20.mzSpeaker}
							label={systemAudioLabel}
							hint={systemAudioHint}
							checked={systemAudioOn && screenOn}
							disabled={systemAudioDisabled}
							indented
							onToggle={handleToggleSystemAudio}
						/>
					</>
				)}
				<GoLiveToggleRow
					id="go-live-mic"
					icon={MzIcons20.mzMic}
					label={micLabel}
					checked={micOn}
					disabled={submitting}
					onToggle={handleToggleMic}
				/>
				<GoLiveToggleRow
					id="go-live-camera"
					icon={MzIcons20.mzCamera}
					label={cameraLabel}
					checked={cameraOn}
					disabled={submitting}
					onToggle={handleToggleCamera}
				/>
				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
						className="rounded-lg px-4 py-2 text-sm font-medium text-theme-primary transition-colors hover:bg-item-theme-hover disabled:opacity-50"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						disabled={!canStart}
						onClick={handleStart}
						className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{startLabel}
					</button>
				</div>
			</div>
		</Modal>
	);
}
