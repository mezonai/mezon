import {
	ControlBarControls,
	DisconnectButton,
	LeaveIcon,
	MediaDeviceMenu,
	TrackToggle,
	useLocalParticipantPermissions,
	usePersistentUserChoices
} from '@livekit/components-react';
import { selectShowScreen, selectVoiceFullScreen, useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { Track } from 'livekit-client';
import Tooltip from 'rc-tooltip';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
	onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
	variation?: 'minimal' | 'verbose' | 'textOnly';
	controls?: ControlBarControls;
	saveUserChoices?: boolean;
	onLeaveRoom: () => void;
	onFullScreen: () => void;
	onScreenShare: (enabled: boolean) => void;
}

export function ControlBar({
	variation,
	controls,
	saveUserChoices = true,
	onDeviceError,
	onLeaveRoom,
	onFullScreen,
	onScreenShare
}: ControlBarProps) {
	const dispatch = useAppDispatch();
	const isTooLittleSpace = useMediaQuery('max-width: 760px');

	const defaultVariation = isTooLittleSpace ? 'minimal' : 'verbose';
	variation ??= defaultVariation;

	const visibleControls = { leave: true, ...controls };

	const showScreen = useSelector(selectShowScreen);

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

	const showIcon = variation === 'minimal' || variation === 'verbose';
	const showText = variation === 'textOnly' || variation === 'verbose';

	const browserSupportsScreenSharing = supportsScreenSharing();

	const { saveAudioInputDeviceId, saveVideoInputDeviceId } = usePersistentUserChoices({
		preventSave: !saveUserChoices
	});

	const microphoneOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => isUserInitiated ?? dispatch(voiceActions.setShowMicrophone(enabled)),
		[dispatch]
	);

	const cameraOnChange = useCallback(
		(enabled: boolean, isUserInitiated: boolean) => isUserInitiated ?? dispatch(voiceActions.setShowCamera(enabled)),
		[dispatch]
	);

	return (
		<div className="lk-control-bar relative">
			{visibleControls.microphone && (
				<div className="lk-button-group">
					<TrackToggle
						source={Track.Source.Microphone}
						showIcon={showIcon}
						onChange={microphoneOnChange}
						onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Microphone, error })}
					>
						{showText && 'Microphone'}
					</TrackToggle>
					<div className="lk-button-group-menu">
						<MediaDeviceMenu
							kind="audioinput"
							onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? 'default')}
						/>
					</div>
				</div>
			)}
			{visibleControls.camera && (
				<div className="lk-button-group">
					<TrackToggle
						source={Track.Source.Camera}
						showIcon={showIcon}
						onChange={cameraOnChange}
						onDeviceError={(error) => onDeviceError?.({ source: Track.Source.Camera, error })}
					>
						{showText && 'Camera'}
					</TrackToggle>
					<div className="lk-button-group-menu">
						<MediaDeviceMenu
							kind="videoinput"
							onActiveDeviceChange={(_kind, deviceId) => saveVideoInputDeviceId(deviceId ?? 'default')}
						/>
					</div>
				</div>
			)}
			{visibleControls.screenShare && browserSupportsScreenSharing && (
				<TrackToggle
					source={Track.Source.ScreenShare}
					captureOptions={{ audio: true, selfBrowserSurface: 'include' }}
					showIcon={showIcon}
					onChange={onScreenShare}
					onDeviceError={(error) => onDeviceError?.({ source: Track.Source.ScreenShare, error })}
				>
					{showText && (showScreen ? 'Stop screen share' : 'Share screen')}
				</TrackToggle>
			)}
			{visibleControls.leave && (
				<DisconnectButton onClick={onLeaveRoom}>
					{showIcon && <LeaveIcon />}
					{showText && 'Leave'}
				</DisconnectButton>
			)}
			<div onClick={onFullScreen} className="absolute bottom-6 !right-6">
				{isFullScreen ? (
					<Tooltip
						placement="topRight"
						overlay={<span className="bg-[#2B2B2B] p-2 rounded text-[16px] absolute bottom-[5px] -right-[16px]">Exit Full Screen</span>}
						overlayClassName="whitespace-nowrap z-50"
						getTooltipContainer={() => document.getElementById('livekitRoom') || document.body}
					>
						<span>
							<Icons.ExitFullScreen />
						</span>
					</Tooltip>
				) : (
					<Tooltip
						placement="topRight"
						overlay={<span className="bg-[#2B2B2B] p-2 rounded text-[16px] absolute bottom-[5px] -right-[16px]">Full Screen</span>}
						overlayClassName="whitespace-nowrap"
						key={Number(isFullScreen)}
					>
						<span>
							<Icons.FullScreen />
						</span>
					</Tooltip>
				)}
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
