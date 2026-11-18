import { liveStreamActions, toastActions, useAppDispatch } from '@mezon/store';
import { Modal } from '@mezon/ui';
import { ensureMediaPermission, reportMediaAccessError, reportMediaAccessGranted } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { setPendingLiveCapture } from './liveSessionHolder';
import { openLiveCameraStream, openLiveMicStream, requestDisplayMedia } from './mixer';

type GoLiveSwitchProps = {
	id: string;
	label: string;
	checked: boolean;
	disabled: boolean;
	onToggle: () => void;
};

function GoLiveSwitch({ id, label, checked, disabled, onToggle }: GoLiveSwitchProps) {
	return (
		<label htmlFor={id} className={`flex items-center gap-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
			<span className="text-sm text-theme-primary-active">{label}</span>
			<button
				id={id}
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={label}
				disabled={disabled}
				onClick={onToggle}
				className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
					checked ? 'bg-[#5865f2]' : 'bg-zinc-500'
				}`}
			>
				<span
					className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
				/>
			</button>
		</label>
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
	const startRunRef = useRef(0);

	const canShareScreen = useMemo(() => typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function', []);

	const [systemAudioOn, setSystemAudioOn] = useState<boolean>(false);
	const [micOn, setMicOn] = useState<boolean>(true);
	const [cameraOn, setCameraOn] = useState<boolean>(false);
	const [submitting, setSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (!showModal) {
			startRunRef.current += 1;
			return;
		}
		setSystemAudioOn(false);
		setMicOn(true);
		setCameraOn(false);
		setSubmitting(false);
	}, [canShareScreen, showModal]);

	useEffect(
		() => () => {
			startRunRef.current += 1;
		},
		[]
	);

	const handleToggleSystemAudio = useCallback(() => {
		setSystemAudioOn((prev) => !prev);
	}, []);

	const handleToggleMic = useCallback(() => {
		setMicOn((prev) => !prev);
	}, []);

	const handleToggleCamera = useCallback(() => {
		setCameraOn((prev) => !prev);
	}, []);

	const modalTitle = useMemo(() => t('goLive'), [t]);
	const cancelLabel = useMemo(() => t('common:cancel', { defaultValue: 'Cancel' }), [t]);
	const startLabel = useMemo(() => t('startLive'), [t]);
	const cameraOnlyLabel = useMemo(() => t('cameraOnly'), [t]);
	const systemAudioLabel = useMemo(() => t('alsoShareSystemAudio'), [t]);
	const micLabel = useMemo(() => t('liveMic'), [t]);
	const cameraLabel = useMemo(() => t('liveCamera'), [t]);
	const startLive = useCallback(
		async (withScreen: boolean) => {
			if (submitting) return;
			setSubmitting(true);
			const runId = ++startRunRef.current;

			const wantScreen = canShareScreen && withScreen;
			const wantCamera = !wantScreen || cameraOn;
			const wantSystemAudio = wantScreen && systemAudioOn;
			if (micOn && !(await ensureMediaPermission('microphone'))) {
				setSubmitting(false);
				return;
			}
			if (wantCamera && !(await ensureMediaPermission('camera'))) {
				setSubmitting(false);
				return;
			}
			if (runId !== startRunRef.current) return;
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

			const liveContext = audioContext;
			const abandon = (streams: Array<MediaStream | null>) => {
				if (runId === startRunRef.current) return false;
				streams.forEach(stopStreamTracks);
				void Promise.resolve(liveContext.close()).catch(() => undefined);
				return true;
			};

			let screenStream: MediaStream | null = null;
			if (screenPromise) {
				try {
					screenStream = await screenPromise;
					if (abandon([screenStream])) return;
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
					if (abandon([])) return;
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

			if (abandon([screenStream])) return;

			let cameraStream: MediaStream | null = null;
			if (wantCamera) {
				try {
					cameraStream = await openLiveCameraStream();
					reportMediaAccessGranted('camera');
				} catch (err) {
					cameraStream = null;
					if (abandon([screenStream])) return;
					if (!reportMediaAccessError('camera', err))
						dispatch(
							toastActions.addToast({
								message: t('liveError.source', { source: t('liveCamera') }),
								type: 'error',
								autoClose: 5000
							})
						);
				}
			}

			if (abandon([screenStream, cameraStream])) return;

			if (!screenStream && !cameraStream) {
				void Promise.resolve(audioContext.close()).catch(() => undefined);
				setSubmitting(false);
				return;
			}

			let micStream: MediaStream | null = null;
			if (micOn) {
				try {
					micStream = await openLiveMicStream();
					reportMediaAccessGranted('microphone');
				} catch (err) {
					micStream = null;
					if (abandon([screenStream, cameraStream])) return;
					if (!reportMediaAccessError('microphone', err))
						dispatch(
							toastActions.addToast({
								message: t('liveError.source', { source: t('liveMic') }),
								type: 'error',
								autoClose: 5000
							})
						);
				}
			}

			if (abandon([screenStream, cameraStream, micStream])) return;

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
		},
		[cameraOn, canShareScreen, channelId, channelLabel, clanId, clanName, dispatch, micOn, onClose, parentId, submitting, systemAudioOn, t]
	);

	const handleGoLive = useCallback(() => {
		void startLive(true);
	}, [startLive]);

	const handleCameraOnly = useCallback(() => {
		void startLive(false);
	}, [startLive]);

	return createPortal(
		<Modal showModal={showModal} onClose={onClose} title={modalTitle} isInviteModal>
			<div className="flex flex-col gap-5">
				<div className="flex flex-wrap items-center justify-between gap-4">
					{canShareScreen ? (
						<GoLiveSwitch
							id="go-live-system-audio"
							label={systemAudioLabel}
							checked={systemAudioOn}
							disabled={submitting}
							onToggle={handleToggleSystemAudio}
						/>
					) : (
						<span />
					)}
					<div className="flex items-center gap-4">
						<GoLiveSwitch id="go-live-mic" label={micLabel} checked={micOn} disabled={submitting} onToggle={handleToggleMic} />
						<GoLiveSwitch
							id="go-live-camera"
							label={cameraLabel}
							checked={cameraOn}
							disabled={submitting}
							onToggle={handleToggleCamera}
						/>
					</div>
				</div>
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={submitting}
						className="rounded px-4 py-2 text-sm font-medium text-theme-primary hover:underline disabled:opacity-50"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={handleCameraOnly}
						disabled={submitting}
						className="rounded bg-button-secondary bg-secondary-button-hover px-4 py-2 text-sm font-medium text-theme-primary-active disabled:cursor-not-allowed disabled:opacity-50"
					>
						{cameraOnlyLabel}
					</button>
					{canShareScreen && (
						<button
							type="button"
							onClick={handleGoLive}
							disabled={submitting}
							className="rounded bg-[#5865f2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{startLabel}
						</button>
					)}
				</div>
			</div>
		</Modal>,
		document.body
	);
}
