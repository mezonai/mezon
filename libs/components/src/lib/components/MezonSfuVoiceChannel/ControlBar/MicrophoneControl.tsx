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
	weakNetwork?: boolean;
}

export const MicrophoneControl = ({
	enabled,
	devices,
	selectedDeviceId,
	onToggle,
	onSelect,
	permissionState,
	hasMicrophoneAccess,
	onPermissionRequest,
	weakNetwork
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
			{!showWarning && weakNetwork && (
				<div className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 h-3.5 w-3.5 rounded-full border-2 border-[#11111b] bg-orange-500" />
			)}
			<SfuDeviceMenu label="Microphone" devices={devices} selectedDeviceId={selectedDeviceId} onSelect={onSelect} />
		</div>
	);
};
