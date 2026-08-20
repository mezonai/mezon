import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SfuDeviceMenu } from './MediaDeviceMenu/SfuDeviceMenu';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface CameraControlProps {
	enabled: boolean;
	devices: MediaDeviceInfo[];
	selectedDeviceId: string;
	onToggle: () => void;
	onSelect: (deviceId: string) => void;
}

export const CameraControl = ({ enabled, devices, selectedDeviceId, onToggle, onSelect }: CameraControlProps) => {
	const { t } = useTranslation('channelVoice');
	return (
		<div className="relative">
			<button
				id="btn-meet-camera"
				type="button"
				title={t(enabled ? 'turnOffCamera' : 'turnOnCamera')}
				aria-label={t(enabled ? 'turnOffCamera' : 'turnOnCamera')}
				className={SFU_CONTROL_BUTTON_CLASS}
				onClick={onToggle}
			>
				{enabled ? <Icons.VoiceCameraIcon scale={1.5} /> : <Icons.VoiceCameraDisabledIcon scale={1.5} />}
			</button>
			<SfuDeviceMenu label="Camera" devices={devices} selectedDeviceId={selectedDeviceId} onSelect={onSelect} />
		</div>
	);
};
