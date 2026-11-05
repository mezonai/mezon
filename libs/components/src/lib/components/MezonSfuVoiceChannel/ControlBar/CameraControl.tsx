import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SfuDeviceMenu } from './MediaDeviceMenu/SfuDeviceMenu';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface CameraControlProps {
	enabled: boolean;
	devices: MediaDeviceInfo[];
	selectedDeviceId: string;
	onToggle: () => void;
	onSelect: (deviceId: string) => void;
	onDeviceMenuOpenChange?: (open: boolean) => void;
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
	onDeviceMenuOpenChange,
	permissionState,
	hasCameraAccess,
	onPermissionRequest
}: CameraControlProps) => {
	const { t } = useTranslation('channelVoice');
	const showWarning = permissionState === 'denied' || hasCameraAccess === false;
	const label = t(showWarning ? 'mediaPermission.needed.camera' : enabled ? 'turnOffCamera' : 'turnOnCamera');

	const handleClick = async () => {
		if (!enabled && (permissionState !== 'granted' || hasCameraAccess === false) && onPermissionRequest) {
			await onPermissionRequest();
			return;
		}
		onToggle();
	};

	return (
		<div className="relative">
			<button id="btn-meet-camera" type="button" title={label} aria-label={label} className={SFU_CONTROL_BUTTON_CLASS} onClick={handleClick}>
				{enabled ? (
					<>
						<MezonIcon icon={MzIcons24.mzVideo} className="text-white max-md:hidden" />
						<MezonIcon icon={MzIcons20.mzVideo} className="hidden text-white max-md:block" />
					</>
				) : (
					<>
						<MezonIcon icon={MzIcons24.mzVideoOff} className="text-white max-md:hidden" />
						<MezonIcon icon={MzIcons20.mzVideoOff} className="hidden text-white max-md:block" />
					</>
				)}
			</button>
			{showWarning && (
				<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
					<span className="text-black text-xs font-bold">!</span>
				</div>
			)}
			<SfuDeviceMenu
				label="Camera"
				devices={devices}
				selectedDeviceId={selectedDeviceId}
				onSelect={onSelect}
				onOpenChange={onDeviceMenuOpenChange}
			/>
		</div>
	);
};
