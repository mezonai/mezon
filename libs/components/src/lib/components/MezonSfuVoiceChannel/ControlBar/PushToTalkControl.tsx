import { Icons } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SfuDeviceMenu } from './MediaDeviceMenu/SfuDeviceMenu';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface PushToTalkControlProps {
	active: boolean;
	onChange: (active: boolean) => void;
	devices: MediaDeviceInfo[];
	selectedDeviceId: string;
	onSelect: (deviceId: string) => void;
	onDeviceMenuOpenChange?: (open: boolean) => void;
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	hasMicrophoneAccess?: boolean;
	onPermissionRequest?: () => Promise<void>;
	weakNetwork?: boolean;
}

export const PushToTalkControl = ({
	active,
	onChange,
	devices,
	selectedDeviceId,
	onSelect,
	onDeviceMenuOpenChange,
	permissionState,
	hasMicrophoneAccess,
	onPermissionRequest,
	weakNetwork
}: PushToTalkControlProps) => {
	const { t } = useTranslation('channelVoice');
	const showWarning = permissionState === 'denied' || hasMicrophoneAccess === false;
	const label = showWarning ? t('mediaPermission.needed.microphone') : 'Push to talk';

	const handlePointerDown = async (event: React.PointerEvent<HTMLButtonElement>) => {
		if ((permissionState !== 'granted' || hasMicrophoneAccess === false) && onPermissionRequest) {
			await onPermissionRequest();
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		onChange(true);
	};

	return (
		<div className="relative">
			<button
				id="btn-meet-push-to-talk"
				type="button"
				title={label}
				aria-label={label}
				aria-pressed={active}
				className={`${SFU_CONTROL_BUTTON_CLASS} ${active ? '!bg-green-600' : ''}`}
				onPointerDown={handlePointerDown}
				onPointerUp={() => onChange(false)}
				onPointerCancel={() => onChange(false)}
				onLostPointerCapture={() => onChange(false)}
			>
				<Icons.InPttCall className="h-6 w-6" />
			</button>
			{showWarning && (
				<div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
					<span className="text-black text-xs font-bold">!</span>
				</div>
			)}
			{!showWarning && weakNetwork && (
				<div className="pointer-events-none absolute -right-0.5 -top-0.5 z-10 h-3.5 w-3.5 rounded-full border-2 border-[#11111b] bg-orange-500" />
			)}
			<SfuDeviceMenu
				label="Microphone"
				devices={devices}
				selectedDeviceId={selectedDeviceId}
				onSelect={onSelect}
				onOpenChange={onDeviceMenuOpenChange}
			/>
		</div>
	);
};
