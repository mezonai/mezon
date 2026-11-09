import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
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
	onDeviceMenuOpenChange?: (open: boolean) => void;
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	hasMicrophoneAccess?: boolean;
	onPermissionRequest?: () => Promise<void>;
	weakNetwork?: boolean;
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
	onDeviceMenuOpenChange,
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
					<>
						<MezonIcon icon={MzIcons24.mzMic} className="text-white max-md:hidden" />
						<MezonIcon icon={MzIcons20.mzMic} className="hidden text-white max-md:block" />
					</>
				) : (
					<>
						<MezonIcon icon={MzIcons24.mzMicOff} className="text-white max-md:hidden" />
						<MezonIcon icon={MzIcons20.mzMicOff} className="hidden text-white max-md:block" />
					</>
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
			<SfuAudioDeviceMenu
				inputDevices={devices}
				outputDevices={outputDevices}
				selectedInputDeviceId={selectedDeviceId}
				selectedOutputDeviceId={selectedOutputDeviceId}
				onSelectInputDevice={onSelect}
				onSelectOutputDevice={onSelectOutput}
				onOpenChange={onDeviceMenuOpenChange}
			/>
		</div>
	);
};
