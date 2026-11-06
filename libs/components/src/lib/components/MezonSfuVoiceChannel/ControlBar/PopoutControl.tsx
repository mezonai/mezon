import { MezonIcon, MzIcons20 } from '@mezon/ui';

export const PopoutControl = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
	<button
		type="button"
		title={active ? 'Close popout' : 'Popout selected video'}
		aria-label={active ? 'Close popout' : 'Popout selected video'}
		className={`cursor-pointer p-2 text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)] ${active ? 'text-[var(--mz-icon-selected)]' : ''}`}
		onClick={onToggle}
	>
		<MezonIcon icon={MzIcons20.mzExternalLink} className={`${active ? 'rotate-180' : ''}`} />
	</button>
);
