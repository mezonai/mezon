import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SfuAudioDeviceMenu } from './MediaDeviceMenu/SfuAudioDeviceMenu';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface MicrophoneControlProps {
	enabled: boolean;
	devices: MediaDeviceInfo[];
	outputDevices?: MediaDeviceInfo[];
	selectedDeviceId: string;
	selectedOutputDeviceId?: string;
	onToggle: () => void;
	onSelect: (deviceId: string) => void;
	onSelectOutput?: (deviceId: string) => void;
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	hasMicrophoneAccess?: boolean;
	onPermissionRequest?: () => Promise<void>;
}

export const MicrophoneControl = ({
	enabled,
	devices,
	outputDevices,
	selectedDeviceId,
	selectedOutputDeviceId,
	onToggle,
	onSelect,
	onSelectOutput,
	permissionState,
	hasMicrophoneAccess,
	onPermissionRequest
}: MicrophoneControlProps) => {
	const { t } = useTranslation('channelVoice');
	const showWarning = permissionState === 'denied' || hasMicrophoneAccess === false;
	const label = showWarning ? t('mediaPermission.needed.microphone') : t(enabled ? 'turnOffMicrophone' : 'turnOnMicrophone');
	const handleClick = async () => {
		if (!enabled && (permissionState !== 'granted' || hasMicrophoneAccess === false) && onPermissionRequest) {
			await onPermissionRequest();
			return;
		}
		onToggle();
	};

	return (
		<div className="relative">
			<button id="btn-meet-micro" type="button" title={label} aria-label={label} className={SFU_CONTROL_BUTTON_CLASS} onClick={handleClick}>
				{enabled ? (
					<Icons.VoiceMicIcon className="h-6 w-6 max-lg:h-5 max-lg:w-5 max-md:h-5 max-md:w-5" scale={2.5} />
				) : (
					<Icons.VoiceMicDisabledIcon className="h-6 w-6 max-lg:h-5 max-lg:w-5 max-md:h-5 max-md:w-5" scale={2.5} />
				)}
			</button>
			{showWarning && (
				<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
					<span className="text-black text-xs font-bold">!</span>
				</div>
			)}
			<SfuAudioDeviceMenu
				inputDevices={devices}
				outputDevices={outputDevices}
				selectedInputDeviceId={selectedDeviceId}
				selectedOutputDeviceId={selectedOutputDeviceId}
				onSelectInputDevice={onSelect}
				onSelectOutputDevice={onSelectOutput}
			/>
		</div>
	);
};
