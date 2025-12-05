import { useLocalParticipantPermissions } from '@livekit/components-react';
import { useAppDispatch, voiceActions } from '@mezon/store';
import isElectron from 'is-electron';
import { Track, VideoPresets } from 'livekit-client';
import { memo, useCallback } from 'react';
import { ScreenShareToggleButton } from './TrackToggle/ScreenShareToggleButton';
import { TrackToggle } from './TrackToggle/TrackToggle';
import { trackSourceToProtocol } from './hooks/useControlBarPermissions';

interface ScreenShareControlProps {
	showScreen: boolean;
	isShowMember?: boolean;
	saveUserChoices?: boolean;
	onDeviceError?: (error: Error) => void;
	onDesktopScreenShare?: () => void;
}

const SCREEN_SHARE_PRESET = VideoPresets.h1080;

export const ScreenShareControl = memo(
	({ showScreen, isShowMember, saveUserChoices = true, onDeviceError, onDesktopScreenShare }: ScreenShareControlProps) => {
		const dispatch = useAppDispatch();
		const isDesktop = isElectron();
		const localPermissions = useLocalParticipantPermissions();

		const canPublishScreenShare = useCallback(() => {
			if (!localPermissions) return false;
			return (
				localPermissions.canPublish &&
				(localPermissions.canPublishSources.length === 0 ||
					localPermissions.canPublishSources.includes(trackSourceToProtocol(Track.Source.ScreenShare)))
			);
		}, [localPermissions]);

		const handleChange = useCallback(
			(enabled: boolean, isUserInitiated: boolean) => {
				if (!isUserInitiated) return;

				if (enabled) {
					dispatch(voiceActions.setFullScreen(false));
				}

				if (enabled && !canPublishScreenShare()) {
					console.warn('Cannot enable screen share: insufficient permissions');
					return;
				}
			},
			[dispatch, canPublishScreenShare]
		);

		if (isDesktop) {
			return (
				<ScreenShareToggleButton
					onClick={onDesktopScreenShare}
					className={`w-14 aspect-square max-md:w-10 max-md:p-2 !rounded-full flex justify-center items-center ${!isShowMember && 'text-white'}`}
				/>
			);
		}

		return (
			<TrackToggle
				key={+showScreen}
				initialState={showScreen}
				className={`w-14 aspect-square max-md:w-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none ${isShowMember ? 'bg-zinc-500 dark:bg-zinc-900' : 'bg-zinc-700'}`}
				source={Track.Source.ScreenShare}
				captureOptions={{ audio: true, selfBrowserSurface: 'include', resolution: VideoPresets.h720.resolution }}
				publishOptions={{
					simulcast: false,
					videoEncoding: {
						...VideoPresets.h720.encoding,
						priority: 'high'
					}
				}}
				onChange={handleChange}
				onDeviceError={onDeviceError}
			/>
		);
	}
);
