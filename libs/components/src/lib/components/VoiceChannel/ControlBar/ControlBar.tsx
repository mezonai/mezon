import {
	ControlBarControls,
	useLocalParticipant,
	useLocalParticipantPermissions,
	usePersistentUserChoices,
	useTracks
} from '@livekit/components-react';
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
import { requestMediaPermission, useMediaPermissions } from '@mezon/utils';

import isElectron from 'is-electron';
import { LocalTrackPublication, Track } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ScreenSelectionModal from '../../ScreenSelectionModal/ScreenSelectionModal';
import { BackgroundEffectsMenu } from './BackgroundEffectsMenu';
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
	isExternalCalling?: boolean;
}

export function ControlBar({
	variation,
	controls,
	saveUserChoices = true,
	onDeviceError,
	onLeaveRoom,
	onFullScreen,
	isExternalCalling
}: ControlBarProps) {
	const dispatch = useAppDispatch();
	const isTooLittleSpace = useMediaQuery('max-width: 760px');
	const audioScreenTrackRef = useRef<LocalTrackPublication | null>(null);

	const { hasCameraAccess, hasMicrophoneAccess } = useMediaPermissions();

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
	const isShowSelectScreenModal = useSelector(selectShowSelectScreenModal);
	const localPermissions = useLocalParticipantPermissions();
	const localParticipant = useLocalParticipant();
	const isOpenPopOut = useSelector(selectVoiceOpenPopOut);

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

	const handleRequestCameraPermission = useCallback(async () => {
		const permissionStatus = await requestMediaPermission('video');
		if (permissionStatus === 'granted') {
			dispatch(voiceActions.setShowCamera(true));
		}
	}, []);

	const handleRequestMicrophonePermission = useCallback(async () => {
		const permissionStatus = await requestMediaPermission('audio');
		if (permissionStatus === 'granted') {
			dispatch(voiceActions.setShowMicrophone(true));
		}
	}, []);

	const microphoneOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => {
			if (isUserInitiated) {
				if (!hasMicrophoneAccess && enabled) {
					handleRequestMicrophonePermission();
				} else {
					dispatch(voiceActions.setShowMicrophone(enabled));
				}
			}
		},
		[hasMicrophoneAccess]
	);

	const cameraOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => {
			if (isUserInitiated) {
				if (!hasCameraAccess && enabled) {
					handleRequestCameraPermission();
				} else {
					dispatch(voiceActions.setShowCamera(enabled));
				}
			}
		},
		[hasCameraAccess]
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
			if (!stream) return;

			const videoTrack = stream.getVideoTracks()[0];
			try {
				const trackPublication = await localParticipant.localParticipant.publishTrack(videoTrack, {
					name: 'screen-share',
					source: Track.Source.ScreenShare
				});

				screenTrackRef.current = trackPublication;
			} catch (error) {
				console.error('Error publishing screen track:', error);
			}
		};
		const publishScreenAudioTrack = async () => {
			if (audioScreenTrackRef.current?.track) {
				audioScreenTrackRef.current.track.stop?.();
				localParticipant.localParticipant.unpublishTrack(audioScreenTrackRef.current.track);
				audioScreenTrackRef.current = null;
			}
			if (!stream) return;

			const audioTrack = stream.getAudioTracks()[0];
			try {
				const audioPublication = await localParticipant.localParticipant.publishTrack(audioTrack, {
					name: 'screen-share-audio',
					source: Track.Source.ScreenShareAudio
				});

				audioScreenTrackRef.current = audioPublication;
			} catch (error) {
				console.error('Error publishing screen track:', error);
			}
		};

		publishScreenAudioTrack();
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

	let popoutWindow: Window | null = null;
	const screenShareTracks = useTracks([
		{ source: Track.Source.ScreenShare, withPlaceholder: false },
		{ source: Track.Source.Camera, withPlaceholder: false }
	]);
	const togglePopout = useCallback(() => {
		if (window.location.pathname === '/popout') {
			dispatch(voiceActions.setOpenPopOut(false));
			window.close();
			return;
		}
		(window as any).sharedTracks = {
			listTracks: screenShareTracks
		};
		popoutWindow = window.open('/popout', 'LiveKitPopout', 'width=800,height=600,left=100,top=100');

		if (popoutWindow) {
			popoutWindow.onload = () => {
				const trackRef = screenShareTracks.find((ref) => ref.publication?.videoTrack);
				if (!trackRef) return;
			};
		}

		if (!popoutWindow) {
			console.error('Pop-up window blocked!');
			return;
		}

		dispatch(voiceActions.setOpenPopOut(true));

		const checkIfClosed = setInterval(() => {
			if (popoutWindow?.closed) {
				clearInterval(checkIfClosed);
				popoutWindow = null;
				dispatch(voiceActions.setOpenPopOut(false));
			}
		}, 500);
	}, [screenShareTracks, screenShareTracks.length]);

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
				{visibleControls.microphone && (
					<div className="relative rounded-full">
						<TrackToggle
							key={+showMicrophone}
							initialState={showMicrophone}
							className="w-14 h-14 !rounded-full flex justify-center items-center"
							source={Track.Source.Microphone}
							onChange={microphoneOnChange}
							onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
						/>
						{hasMicrophoneAccess && (
							<MediaDeviceMenu
								kind="audioinput"
								onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? 'default')}
							/>
						)}
					</div>
				)}
				{visibleControls.camera && (
					<div className="relative rounded-full">
						<TrackToggle
							key={+showCamera}
							initialState={showCamera}
							className="w-14 h-14 !rounded-full flex justify-center items-center"
							source={Track.Source.Camera}
							onChange={cameraOnChange}
							onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Camera, error })}
						/>
						{hasCameraAccess && (
							<>
								<MediaDeviceMenu
									kind="videoinput"
									onActiveDeviceChange={(_kind, deviceId) => saveVideoInputDeviceId(deviceId ?? 'default')}
								/>
								{showCamera && typeof window !== 'undefined' && 'MediaStreamTrackGenerator' in window && (
									<BackgroundEffectsMenu participant={localParticipant.localParticipant} />
								)}
							</>
						)}
					</div>
				)}
				{visibleControls.screenShare &&
					browserSupportsScreenSharing &&
					(!isDesktop ? (
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
					))}
				{visibleControls.leave && (
					<div
						onClick={onLeaveRoom}
						className="w-14 h-14 bg-[#da373c] hover:bg-[#a12829] cursor-pointer rounded-full flex justify-center items-center"
					>
						<Icons.EndCall className="w-6 h-6" />
					</div>
				)}
			</div>
			<div className="flex justify-end gap-4">
				{!isExternalCalling && (
					<div onClick={togglePopout}>
						{isOpenPopOut ? (
							<span>
								<Icons.VoicePopOutIcon className="cursor-pointer hover:text-white text-[#B5BAC1] rotate-180" />
							</span>
						) : (
							<span>
								<Icons.VoicePopOutIcon className="cursor-pointer hover:text-white text-[#B5BAC1] " />
							</span>
						)}
					</div>
				)}

				<div onClick={onFullScreen}>
					{isFullScreen ? (
						<span>
							<Icons.ExitFullScreen className="cursor-pointer hover:text-white text-[#B5BAC1]" />
						</span>
					) : (
						<span>
							<Icons.FullScreen className="cursor-pointer hover:text-white text-[#B5BAC1]" />
						</span>
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
