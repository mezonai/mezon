import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import type { ComponentProps } from 'react';
import { memo } from 'react';

type AppChannelListIconProps = Omit<ComponentProps<typeof MezonIcon>, 'icon'> & {
	isEmphasized: boolean;
	size?: 16 | 20;
};

export const AppChannelListIcon = memo(function AppChannelListIcon({ isEmphasized, size = 20, className = '', ...props }: AppChannelListIconProps) {
	const colorClass = isEmphasized ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)] group-hover:text-[var(--mz-icon-selected)]';
	return (
		<MezonIcon icon={size === 16 ? MzIcons16.mzChannelApp : MzIcons20.mzChannelApp} className={`${className} ${colorClass}`.trim()} {...props} />
	);
});
