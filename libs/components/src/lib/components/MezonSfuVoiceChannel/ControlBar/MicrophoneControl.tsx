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
}

export const MicrophoneControl = ({ enabled, devices, selectedDeviceId, onToggle, onSelect }: MicrophoneControlProps) => {
	const { t } = useTranslation('channelVoice');
	return (
		<div className="relative">
			<button
				id="btn-meet-micro"
				type="button"
				title={t(enabled ? 'turnOffMicrophone' : 'turnOnMicrophone')}
				aria-label={t(enabled ? 'turnOffMicrophone' : 'turnOnMicrophone')}
				className={SFU_CONTROL_BUTTON_CLASS}
				onClick={onToggle}
			>
				{enabled ? <Icons.VoiceMicIcon scale={2.5} /> : <Icons.VoiceMicDisabledIcon scale={2.5} />}
			</button>
			<SfuDeviceMenu label="Microphone" devices={devices} selectedDeviceId={selectedDeviceId} onSelect={onSelect} />
		</div>
	);
};
