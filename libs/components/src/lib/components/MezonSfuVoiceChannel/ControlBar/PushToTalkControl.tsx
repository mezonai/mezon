import { MezonIcon, MzIcons24 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import { SfuAudioDeviceMenu } from './MediaDeviceMenu/SfuAudioDeviceMenu';
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
	inputDevices?: MediaDeviceInfo[];
	outputDevices?: MediaDeviceInfo[];
	selectedInputDeviceId?: string;
	selectedOutputDeviceId?: string;
	onSelectInput?: (deviceId: string) => void;
	onSelectOutput?: (deviceId: string) => void;
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
	inputDevices,
	outputDevices,
	selectedInputDeviceId,
	selectedOutputDeviceId,
	onSelectInput,
	onSelectOutput,
	weakNetwork
}: PushToTalkControlProps) => {
	const { t } = useTranslation('channelVoice');
	const showWarning = permissionState === 'denied' || hasMicrophoneAccess === false;
	const label = showWarning ? t('mediaPermission.needed.microphone') : t('pushToTalk.title', { defaultValue: 'Push to talk' });

	const handlePointerDown = async (event: React.PointerEvent<HTMLButtonElement>) => {
		if ((permissionState !== 'granted' || hasMicrophoneAccess === false) && onPermissionRequest) {
			await onPermissionRequest();
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		onChange(true);
	};

	const menuInputDevices = inputDevices ?? devices;
	const menuSelectedInputId = selectedInputDeviceId ?? selectedDeviceId;
	const menuOnSelectInput = onSelectInput ?? onSelect;

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
				<MezonIcon icon={MzIcons24.mzPtt} />
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
				inputDevices={menuInputDevices}
				outputDevices={outputDevices}
				selectedInputDeviceId={menuSelectedInputId}
				selectedOutputDeviceId={selectedOutputDeviceId}
				onSelectInputDevice={menuOnSelectInput}
				onSelectOutputDevice={onSelectOutput}
				onOpenChange={onDeviceMenuOpenChange}
			/>
		</div>
	);
};
