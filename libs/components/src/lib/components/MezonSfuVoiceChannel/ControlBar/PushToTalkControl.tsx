import { Icons } from '@mezon/ui';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

export const PushToTalkControl = ({ active, onChange }: { active: boolean; onChange: (active: boolean) => void }) => (
	<button
		id="btn-meet-push-to-talk"
		type="button"
		title="Push to talk"
		aria-label="Push to talk"
		aria-pressed={active}
		className={`${SFU_CONTROL_BUTTON_CLASS} ${active ? '!bg-green-600' : ''}`}
		onPointerDown={(event) => {
			event.currentTarget.setPointerCapture(event.pointerId);
			onChange(true);
		}}
		onPointerUp={() => onChange(false)}
		onPointerCancel={() => onChange(false)}
		onLostPointerCapture={() => onChange(false)}
	>
		<Icons.InPttCall className="h-6 w-6" />
	</button>
);
