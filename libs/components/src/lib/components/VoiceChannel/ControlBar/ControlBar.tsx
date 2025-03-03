import { ControlBarControls, useLocalParticipantPermissions, usePersistentUserChoices } from '@livekit/components-react';
import {
	selectShowCamera,
	selectShowMicrophone,
	selectShowScreen,
	selectVoiceFullScreen,
	selectVoiceJoined,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Track } from 'livekit-client';
import Tooltip from 'rc-tooltip';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { MediaDeviceMenu } from './MediaDeviceMenu/MediaDeviceMenu';
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

	const defaultVariation = isTooLittleSpace ? 'minimal' : 'verbose';
	variation ??= defaultVariation;

	const visibleControls = { leave: true, ...controls };

	const showScreen = useSelector(selectShowScreen);
	const showCamera = useSelector(selectShowCamera);
	const showMicrophone = useSelector(selectShowMicrophone);
	const isJoined = useSelector(selectVoiceJoined);

	const isFullScreen = useSelector(selectVoiceFullScreen);

	const localPermissions = useLocalParticipantPermissions();

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

	const onScreenShare = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => {
			if (enabled) {
				dispatch(voiceActions.setFullScreen(false));
			}

			if (isUserInitiated) {
				dispatch(voiceActions.setShowScreen(enabled));
			}
		},
		[dispatch]
	);

	return (
		<div className="lk-control-bar justify-between !border-none !bg-transparent">
			<div className="flex justify-start gap-4">
				<span>
					<Icons.VoiceSoundControlIcon className="cursor-pointer dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
				</span>
				<span>
					<Icons.VoiceEmojiControlIcon className="cursor-pointer dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
				</span>
			</div>
			<div className="flex justify-center gap-3">
				{visibleControls.microphone && (
					<div className="relative">
						<Tooltip
							key={+showMicrophone}
							placement="top"
							overlay={
								<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">
									{showMicrophone ? 'Turn Off Microphone' : 'Turn On Microphone'}
								</span>
							}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
							destroyTooltipOnHide
						>
							<TrackToggle
								key={+showMicrophone}
								initialState={showMicrophone}
								className="w-14 h-14 rounded-full flex justify-center items-center"
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
				{visibleControls.camera && (
					<div className="relative">
						<Tooltip
							key={+showCamera}
							placement="top"
							overlay={
								<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">{showCamera ? 'Turn Off Camera' : 'Turn On Camera'}</span>
							}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
							destroyTooltipOnHide
						>
							<TrackToggle
								key={+showCamera}
								initialState={showCamera}
								className="w-14 h-14 rounded-full flex justify-center items-center"
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
						key={+showScreen}
						placement="top"
						overlay={
							<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">{showScreen ? 'Stop screen share' : 'Share Your Screen'}</span>
						}
						overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
						getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
						destroyTooltipOnHide
					>
						<TrackToggle
							key={+showScreen}
							initialState={showScreen}
							className="w-14 h-14 rounded-full flex justify-center items-center"
							source={Track.Source.ScreenShare}
							captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
							onChange={onScreenShare}
							onDeviceError={(error) => onDeviceError?.({ source: Track.Source.ScreenShare, error })}
						/>
					</Tooltip>
				)}
				{visibleControls.leave && (
					<Tooltip
						placement="top"
						overlay={<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">Disconnect</span>}
						overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
						getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
					>
						<div
							onClick={onLeaveRoom}
							className="w-14 h-14 bg-[#da373c] hover:bg-[#a12829] rounded-full flex justify-center items-center"
						>
							<Icons.EndCall className="w-6 h-6" />
						</div>
					</Tooltip>
				)}
			</div>
			<div className="flex justify-end gap-4">
				<Tooltip
					placement="top"
					overlay={<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">Pop Out</span>}
					overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
					getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
				>
					<span>
						<Icons.VoicePopOutIcon className="cursor-pointer dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
					</span>
				</Tooltip>
				<div onClick={onFullScreen}>
					{isFullScreen ? (
						<Tooltip
							placement="topRight"
							overlay={<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">Exit Full Screen</span>}
							overlayClassName="whitespace-nowrap z-50 !p-0 !pt-4"
							getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
						>
							<span>
								<Icons.ExitFullScreen className="cursor-pointer dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
							</span>
						</Tooltip>
					) : (
						<Tooltip
							placement="topRight"
							overlay={<span className="bg-[#2B2B2B] p-2 rounded !text-[16px]">Full Screen</span>}
							overlayClassName="whitespace-nowrap !p-0 !pt-4"
							key={Number(isFullScreen)}
						>
							<span>
								<Icons.FullScreen className="cursor-pointer dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
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

function supportsScreenSharing(): boolean {
	return typeof navigator !== 'undefined' && navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
}
