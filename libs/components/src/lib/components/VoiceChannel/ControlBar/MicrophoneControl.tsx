import { usePersistentUserChoices } from '@livekit/components-react';
import { selectNoiseSuppressionEnabled, useAppDispatch, voiceActions } from '@mezon/store';
import { getNoiseSuppressionAudioCaptureOptions } from '@mezon/utils';
import { Track } from 'livekit-client';
import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { MICROPHONE_DEVICE_KINDS, MediaDeviceMenu } from './MediaDeviceMenu/MediaDeviceMenu';
import { TrackToggle } from './TrackToggle/TrackToggle';

interface MicrophoneControlProps {
	isShowMember?: boolean;
	saveUserChoices?: boolean;
	onDeviceError?: (error: Error) => void;
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	onPermissionRequest?: () => Promise<void>;
}

export const MicrophoneControl = memo(
	({ isShowMember, saveUserChoices = true, onDeviceError, permissionState, onPermissionRequest }: MicrophoneControlProps) => {
		const dispatch = useAppDispatch();
		const noiseSuppressionEnabled = useSelector(selectNoiseSuppressionEnabled);
		const { saveAudioInputDeviceId, saveAudioInputEnabled } = usePersistentUserChoices({
			preventSave: !saveUserChoices
		});

		const handleChange = useCallback(
			async (enabled: boolean, isUserInitiated: boolean) => {
				if (!isUserInitiated) return;

				if (enabled && permissionState !== 'granted' && onPermissionRequest) {
					await onPermissionRequest();
					return;
				}

				saveAudioInputEnabled(enabled);
				dispatch(voiceActions.setShowMicrophone(enabled));
			},
			[dispatch, saveAudioInputEnabled, permissionState, onPermissionRequest]
		);

		const showWarning = permissionState === 'denied';

		const handleActiveDeviceChange = useCallback(
			(kind: MediaDeviceKind, deviceId: string) => {
				if (kind === 'audioinput') {
					saveAudioInputDeviceId(deviceId ?? 'default');
				}
			},
			[saveAudioInputDeviceId]
		);

		return (
			<div className="relative rounded-full">
				<TrackToggle
					id="btn-meet-micro"
					className={`w-14 h-14 max-md:w-10 max-md:h-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none ${
						isShowMember ? 'bg-zinc-700 dark:bg-zinc-900' : 'bg-zinc-900'
					}`}
					source={Track.Source.Microphone}
					captureOptions={getNoiseSuppressionAudioCaptureOptions(noiseSuppressionEnabled)}
					onChange={handleChange}
					onDeviceError={onDeviceError}
				/>
				{showWarning && (
					<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10">
						<span className="text-black text-xs font-bold">!</span>
					</div>
				)}
				<div className="lk-button-group-menu">
					<MediaDeviceMenu kinds={MICROPHONE_DEVICE_KINDS} onActiveDeviceChange={handleActiveDeviceChange} />
				</div>
			</div>
		);
	}
);
