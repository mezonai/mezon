import { ControlBarControls, useLocalParticipant, useLocalParticipantPermissions, usePersistentUserChoices } from '@livekit/components-react';
import {
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectShowSelectScreenModal,
	selectStreamScreen,
	selectVoiceFullScreen,
	selectVoiceOpenPopOut,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMediaPermissions } from '@mezon/utils';

import isElectron from 'is-electron';
import { LocalTrackPublication, Track } from 'livekit-client';
import Tooltip from 'rc-tooltip';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ScreenSelectionModal from '../../ScreenSelectionModal/ScreenSelectionModal';
import { MediaDeviceMenu } from './MediaDeviceMenu/MediaDeviceMenu';
import { ScreenShareToggleButton } from './TrackToggle/ScreenShareToggleButton';
import { TrackToggle } from './TrackToggle/TrackToggle';
interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
	onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
	variation?: 'minimal' | 'verbose' | 'textOnly';
	controls?: ControlBarControls;
	saveUserChoices?: boolean;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
}

export function ControlBar({ variation, controls, saveUserChoices = true, onDeviceError, onLeaveRoom, onFullScreen }: ControlBarProps) {
	const dispatch = useAppDispatch();
	const isTooLittleSpace = useMediaQuery('max-width: 760px');
	const audioScreenTrackRef = useRef<LocalTrackPublication | null>(null);

	const screenTrackRef = useRef<LocalTrackPublication | null>(null);
	const isDesktop = isElectron();
	const defaultVariation = isTooLittleSpace ? 'minimal' : 'verbose';
	variation ??= defaultVariation;
	const stream = useSelector(selectStreamScreen);
	const visibleControls = { leave: true, ...controls };

	const showScreen = useSelector(selectShowScreen);
	const showCamera = useSelector(selectShowCamera);
	const showMicrophone = useSelector(selectShowMicrophone);

	const isFullScreen = useSelector(selectVoiceFullScreen);
	const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
	const isShowSelectScreenModal = useSelector(selectShowSelectScreenModal);
	const localPermissions = useLocalParticipantPermissions();
	const localParticipant = useLocalParticipant();

	if (!localPermissions) {
		visibleControls.camera = false;
		visibleControls.microphone = false;
		visibleControls.screenShare = false;
	} else {
		visibleControls.camera ??= localPermissions.canPublish;
		visibleControls.microphone ??= localPermissions.canPublish;
		visibleControls.screenShare ??= localPermissions.canPublish;
	}

	const browserSupportsScreenSharing = supportsScreenSharing();

	const { saveAudioInputDeviceId, saveVideoInputDeviceId } = usePersistentUserChoices({
		preventSave: !saveUserChoices
	});

	const microphoneOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => (isUserInitiated ? dispatch(voiceActions.setShowMicrophone(enabled)) : null),
		[dispatch]
	);

	const cameraOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => (isUserInitiated ? dispatch(voiceActions.setShowCamera(enabled)) : null),
		[dispatch]
	);

	useEffect(() => {
		if (isShowSelectScreenModal) {
			openScreenSelection();
		}
	}, [isShowSelectScreenModal]);

	const [openScreenSelection, closeScreenSelection] = useModal(() => {
		return <ScreenSelectionModal onClose={closeScreenSelection} />;
	});

	useEffect(() => {
		if (!showScreen && isDesktop) {
			dispatch(voiceActions.setStreamScreen(null));
		}
	}, [dispatch, showScreen]);

	useEffect(() => {
		const publishScreenTrack = async () => {
			if (screenTrackRef.current?.track) {
				screenTrackRef.current.track.stop?.();
				await localParticipant.localParticipant.unpublishTrack(screenTrackRef.current.track);
				screenTrackRef.current = null;
			}
			if (audioScreenTrackRef.current?.track) {
				audioScreenTrackRef.current.track.stop?.();
				localParticipant.localParticipant.unpublishTrack(audioScreenTrackRef.current.track);
				audioScreenTrackRef.current = null;
			}
			if (!stream) return;

			const videoTrack = stream.getVideoTracks()[0];
			try {
				const trackPublication = await localParticipant.localParticipant.publishTrack(videoTrack, {
					name: 'screen-share',
					source: Track.Source.ScreenShare
				});
				// const audioStream = await getAudioScreenStream();
				// if (audioStream !== null || audioStream !== undefined) {
				// 	const audioTrack = audioStream?.getAudioTracks()[0];
				// 	if (audioTrack) {
				// 		audioScreenTrackRef.current = await localParticipant.localParticipant.publishTrack(audioTrack, {
				// 			name: 'screen-share-audio',
				// 			source: Track.Source.ScreenShareAudio
				// 		});
				// 	}
				// }

				screenTrackRef.current = trackPublication;
			} catch (error) {
				console.error('Error publishing screen track:', error);
			}
		};

		publishScreenTrack();
		return () => {
			if (screenTrackRef.current?.track) {
				screenTrackRef.current.track.stop?.();
				localParticipant.localParticipant.unpublishTrack(screenTrackRef.current.track);
				screenTrackRef.current = null;
			}
			if (audioScreenTrackRef.current?.track) {
				audioScreenTrackRef.current.track.stop?.();
				localParticipant.localParticipant.unpublishTrack(audioScreenTrackRef.current.track);
				audioScreenTrackRef.current = null;
			}
		};
	}, [stream]);

	const handleOpenScreenSelection = useCallback(() => {
		if (isDesktop) {
			if (!showScreen) {
				dispatch(voiceActions.setShowSelectScreenModal(true));
			} else {
				dispatch(voiceActions.setShowScreen(false));
			}
		}
	}, [isDesktop, openScreenSelection, showScreen]);

	const onScreenShare = useCallback(
		async (enabled: boolean, isUserInitiated: boolean) => {
			if (enabled) {
				dispatch(voiceActions.setFullScreen(false));
			}

			if (isUserInitiated) {
				dispatch(voiceActions.setShowScreen(enabled));
			}
		},
		[dispatch]
	);

	const { hasCameraAccess, hasMicrophoneAccess } = useMediaPermissions();

	let popoutWindow: Window | null = null;

	const togglePopout = () => {
		if (popoutWindow && !popoutWindow.closed) {
			popoutWindow.close();
			popoutWindow = null;
			dispatch(voiceActions.setOpenPopOut(false));
		} else {
			popoutWindow = window.open('/popout', 'LiveKitPopout', 'width=800,height=600,left=100,top=100');
			if (!popoutWindow) {
				console.error('Pop-up window blocked!');
			} else {
				dispatch(voiceActions.setOpenPopOut(true));
			}
		}
	};

	const livekitRoomId = isOpenPopOut ? 'livekitRoomPopOut' : 'livekitRoom';

	return (
		<div className="lk-control-bar !flex !justify-between !border-none !bg-transparent">
			<div className="flex justify-start gap-4">
				<span>
					<Icons.VoiceSoundControlIcon className="cursor-pointer hover:text-white text-[#B5BAC1] " />
				</span>
				<span>
					<Icons.VoiceEmojiControlIcon className="cursor-pointer hover:text-white text-[#B5BAC1] " />
				</span>
			</div>
			<div className="flex justify-center gap-3">
				{visibleControls.microphone && hasMicrophoneAccess && (
					<div className="relative rounded-full">
						<Tooltip
							showArrow={{ className: '!bottom-1' }}
							key={+showMicrophone}
							placement="top"
							overlay={
								<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">
									{showMicrophone ? 'Turn Off Microphone' : 'Turn On Microphone'}
								</span>
							}
							overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
							destroyTooltipOnHide
						>
							<TrackToggle
								key={+showMicrophone}
								initialState={showMicrophone}
								className="w-14 h-14 !rounded-full flex justify-center items-center"
								source={Track.Source.Microphone}
								onChange={microphoneOnChange}
								onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
							/>
						</Tooltip>
						<MediaDeviceMenu
							kind="audioinput"
							onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? 'default')}
						/>
					</div>
				)}
				{visibleControls.camera && hasCameraAccess && (
					<div className="relative rounded-full">
						<Tooltip
							showArrow={{ className: '!bottom-1' }}
							key={+showCamera}
							placement="top"
							overlay={
								<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">{showCamera ? 'Turn Off Camera' : 'Turn On Camera'}</span>
							}
							overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
							destroyTooltipOnHide
						>
							<TrackToggle
								key={+showCamera}
								initialState={showCamera}
								className="w-14 h-14 !rounded-full flex justify-center items-center"
								source={Track.Source.Camera}
								onChange={cameraOnChange}
								onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Camera, error })}
							/>
						</Tooltip>
						<MediaDeviceMenu
							kind="videoinput"
							onActiveDeviceChange={(_kind, deviceId) => saveVideoInputDeviceId(deviceId ?? 'default')}
						/>
					</div>
				)}
				{visibleControls.screenShare && browserSupportsScreenSharing && (
					<Tooltip
						showArrow={{ className: '!bottom-1' }}
						key={+showScreen}
						placement="top"
						overlay={
							<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">{showScreen ? 'Stop screen share' : 'Share Your Screen'}</span>
						}
						overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
						overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
						getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
						destroyTooltipOnHide
					>
						{!isDesktop ? (
							<TrackToggle
								key={+showScreen}
								initialState={showScreen}
								className="w-14 h-14 !rounded-full flex justify-center items-center"
								source={Track.Source.ScreenShare}
								captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
								onChange={onScreenShare}
								onDeviceError={(error) => onDeviceError?.({ source: Track.Source.ScreenShare, error })}
							/>
						) : (
							<ScreenShareToggleButton
								onClick={handleOpenScreenSelection}
								className="w-14 h-14 !rounded-full flex justify-center items-center"
							/>
						)}
					</Tooltip>
				)}
				{visibleControls.leave && (
					<Tooltip
						showArrow={{ className: '!bottom-1' }}
						placement="top"
						overlay={<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">Disconnect</span>}
						overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
						overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
						getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
					>
						<div
							onClick={onLeaveRoom}
							className="w-14 h-14 bg-[#da373c] hover:bg-[#a12829] cursor-pointer rounded-full flex justify-center items-center"
						>
							<Icons.EndCall className="w-6 h-6" />
						</div>
					</Tooltip>
				)}
			</div>
			<div className="flex justify-end gap-4">
				<div onClick={togglePopout}>
					{isOpenPopOut ? (
						<Tooltip
							showArrow={{ className: '!bottom-1' }}
							placement="top"
							overlay={<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">Return To App</span>}
							overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
						>
							<span>
								<Icons.VoicePopOutIcon className="cursor-pointer hover:text-white text-[#B5BAC1]" />
							</span>
						</Tooltip>
					) : (
						<Tooltip
							showArrow={{ className: '!bottom-1' }}
							placement="top"
							overlay={<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">Pop Out</span>}
							overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
						>
							<span>
								<Icons.VoicePopOutIcon className="cursor-pointer hover:text-white text-[#B5BAC1]" />
							</span>
						</Tooltip>
					)}
				</div>
				<div onClick={onFullScreen}>
					{isFullScreen ? (
						<Tooltip
							showArrow={{ className: '!bottom-1' }}
							placement="topRight"
							align={{
								offset: [11, -4]
							}}
							overlay={<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">Exit Full Screen</span>}
							overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
							overlayClassName="whitespace-nowrap z-50 !p-0"
							getTooltipContainer={() => document.getElementById(livekitRoomId) || document.body}
						>
							<span>
								<Icons.ExitFullScreen className="cursor-pointer hover:text-white text-[#B5BAC1]" />
							</span>
						</Tooltip>
					) : (
						<Tooltip
							showArrow={{ className: '!bottom-1' }}
							placement="topRight"
							align={{
								offset: [11, -4]
							}}
							overlay={<span className="bg-[#2B2B2B] rounded p-[6px] text-[14px]">Full Screen</span>}
							overlayInnerStyle={{ background: 'none', boxShadow: 'none' }}
							overlayClassName="whitespace-nowrap !p-0"
							key={Number(isFullScreen)}
						>
							<span>
								<Icons.FullScreen className="cursor-pointer hover:text-white text-[#B5BAC1]" />
							</span>
						</Tooltip>
					)}
				</div>
			</div>
		</div>
	);
}

function useMediaQuery(query: string): boolean {
	const getMatches = (query: string): boolean => {
		// Prevents SSR issues
		if (typeof window !== 'undefined') {
			return window.matchMedia(query).matches;
		}
		return false;
	};

	const [matches, setMatches] = useState<boolean>(getMatches(query));

	function handleChange() {
		setMatches(getMatches(query));
	}

	useEffect(() => {
		const matchMedia = window.matchMedia(query);

		// Triggered at the first client-side load and if query changes
		handleChange();

		// Listen matchMedia
		if (matchMedia.addListener) {
			matchMedia.addListener(handleChange);
		} else {
			matchMedia.addEventListener('change', handleChange);
		}

		return () => {
			if (matchMedia.removeListener) {
				matchMedia.removeListener(handleChange);
			} else {
				matchMedia.removeEventListener('change', handleChange);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	return matches;
}

const supportsScreenSharing = () => {
	return typeof navigator !== 'undefined' && navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
};

async function getAudioScreenStream() {
	if (!isElectron() || !window.electron) return null;
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const outputDevice = devices.find((device) => device.kind === 'audiooutput');
		const device = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: { exact: outputDevice?.deviceId },
				// noiseSuppression: true,
				// echoCancellation: true,
				sampleRate: 96000, // 44100, 48000, 96000
				channelCount: 2,
				autoGainControl: true,
				sampleSize: 32 // 8, 16, 24, 32
				// voiceIsolation: true
			},
			video: false
		});
		return device;
	} catch (error) {
		console.error('Error getting screen stream:', error);
		return null;
	}
}
