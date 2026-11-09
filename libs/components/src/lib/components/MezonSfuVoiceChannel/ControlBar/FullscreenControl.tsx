import { MezonIcon, MzIcons20 } from '@mezon/ui';

export const FullscreenControl = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
	<button
		type="button"
		title={active ? 'Exit full screen' : 'Full screen'}
		aria-label={active ? 'Exit full screen' : 'Full screen'}
		className="cursor-pointer p-2 text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]"
		onClick={onToggle}
	>
		{active ? <MezonIcon icon={MzIcons20.mzFullscreenExit} /> : <MezonIcon icon={MzIcons20.mzFullscreen} />}
	</button>
);
