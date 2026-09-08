import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SfuDeviceMenu } from './MediaDeviceMenu/SfuDeviceMenu';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface MicrophoneControlProps {
	enabled: boolean;
	devices: MediaDeviceInfo[];
	selectedDeviceId: string;
	onToggle: () => void;
	onSelect: (deviceId: string) => void;
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	hasMicrophoneAccess?: boolean;
	onPermissionRequest?: () => Promise<void>;
}

export const MicrophoneControl = ({
	enabled,
	devices,
	selectedDeviceId,
	onToggle,
	onSelect,
	permissionState,
	hasMicrophoneAccess,
	onPermissionRequest
}: MicrophoneControlProps) => {
	const { t } = useTranslation('channelVoice');
	const showWarning = permissionState === 'denied' || hasMicrophoneAccess === false;

	const handleClick = async () => {
		if ((permissionState !== 'granted' || hasMicrophoneAccess === false) && onPermissionRequest) {
			await onPermissionRequest();
			return;
		}
		onToggle();
	};

	return (
		<div className="relative">
			<button
				id="btn-meet-micro"
				type="button"
				title={t(enabled ? 'turnOffMicrophone' : 'turnOnMicrophone')}
				aria-label={t(enabled ? 'turnOffMicrophone' : 'turnOnMicrophone')}
				className={SFU_CONTROL_BUTTON_CLASS}
				onClick={handleClick}
			>
				{enabled ? <Icons.VoiceMicIcon scale={2.5} /> : <Icons.VoiceMicDisabledIcon scale={2.5} />}
			</button>
			{showWarning && (
				<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
					<span className="text-black text-xs font-bold">!</span>
				</div>
			)}
			<SfuDeviceMenu label="Microphone" devices={devices} selectedDeviceId={selectedDeviceId} onSelect={onSelect} />
		</div>
	);
};
