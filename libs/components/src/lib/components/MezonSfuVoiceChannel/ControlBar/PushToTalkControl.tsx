import { Icons } from '@mezon/ui';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface PushToTalkControlProps {
	active: boolean;
	preparing?: boolean;
	onChange: (active: boolean) => void;
	permissionState?: 'granted' | 'denied' | 'prompt' | null;
	hasMicrophoneAccess?: boolean;
	onPermissionRequest?: () => Promise<void>;
}

export const PushToTalkControl = ({
	active,
	preparing = false,
	onChange,
	permissionState,
	hasMicrophoneAccess,
	onPermissionRequest
}: PushToTalkControlProps) => {
	const showWarning = permissionState === 'denied' || hasMicrophoneAccess === false;

	const handlePointerDown = async (event: React.PointerEvent<HTMLButtonElement>) => {
		if (preparing) return;
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
				title={preparing ? 'Preparing noise suppression — microphone muted' : 'Push to talk'}
				aria-label={preparing ? 'Preparing noise suppression — microphone muted' : 'Push to talk'}
				aria-busy={preparing}
				// handlePointerDown blocks speaking without briefly dimming the idle button.
				aria-disabled={preparing && !active}
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
		</div>
	);
};
