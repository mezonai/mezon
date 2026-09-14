import { Icons } from '@mezon/ui';

export const FullscreenControl = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
	<button
		type="button"
		title={active ? 'Exit full screen' : 'Full screen'}
		aria-label={active ? 'Exit full screen' : 'Full screen'}
		className="cursor-pointer p-2 text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)]"
		onClick={onToggle}
	>
		{active ? <Icons.ExitFullScreen /> : <Icons.FullScreen />}
	</button>
);
