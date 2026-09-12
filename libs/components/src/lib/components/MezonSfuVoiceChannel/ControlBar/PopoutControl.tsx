import { Icons } from '@mezon/ui';

export const PopoutControl = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
	<button
		type="button"
		title={active ? 'Close popout' : 'Popout selected video'}
		aria-label={active ? 'Close popout' : 'Popout selected video'}
		className={`cursor-pointer p-2 text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)] ${
			active ? 'text-[var(--bg-icon-theme-active)]' : ''
		}`}
		onClick={onToggle}
	>
		<Icons.VoicePopOutIcon className={`h-5 w-5 ${active ? 'rotate-180' : ''}`} />
	</button>
);
