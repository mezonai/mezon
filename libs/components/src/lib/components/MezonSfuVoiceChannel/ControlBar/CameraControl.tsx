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
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	hasCameraAccess?: boolean;
	onPermissionRequest?: () => Promise<void>;
}

export const CameraControl = ({
	enabled,
	devices,
	selectedDeviceId,
	onToggle,
	onSelect,
	permissionState,
	hasCameraAccess,
	onPermissionRequest
}: CameraControlProps) => {
	const { t } = useTranslation('channelVoice');
	const showWarning = permissionState === 'denied' || hasCameraAccess === false;

	const handleClick = async () => {
		if ((permissionState !== 'granted' || hasCameraAccess === false) && onPermissionRequest) {
			await onPermissionRequest();
			return;
		}
		onToggle();
	};

	return (
		<div className="relative">
			<button
				id="btn-meet-camera"
				type="button"
				title={t(enabled ? 'turnOffCamera' : 'turnOnCamera')}
				aria-label={t(enabled ? 'turnOffCamera' : 'turnOnCamera')}
				className={SFU_CONTROL_BUTTON_CLASS}
				onClick={handleClick}
			>
				{enabled ? (
					<Icons.VoiceCameraIcon className="h-8 w-8 max-lg:h-7 max-lg:w-7 max-md:h-6 max-md:w-6" scale={1.5} />
				) : (
					<Icons.VoiceCameraDisabledIcon className="h-8 w-8 max-lg:h-7 max-lg:w-7 max-md:h-6 max-md:w-6" scale={1.5} />
				)}
			</button>
			{showWarning && (
				<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
					<span className="text-black text-xs font-bold">!</span>
				</div>
			)}
			<SfuDeviceMenu label="Camera" devices={devices} selectedDeviceId={selectedDeviceId} onSelect={onSelect} />
		</div>
	);
};
