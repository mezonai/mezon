import { Icons } from '@mezon/ui';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const VAR_FILLS: Pick<ComponentProps<typeof Icons.AppChannelIcon>, 'defaultFill1' | 'defaultFill2' | 'defaultFill3' | 'defaultFill4'> = {
	defaultFill1: 'var(--app-fill-1)',
	defaultFill2: 'var(--app-fill-2)',
	defaultFill3: 'var(--app-fill-1)',
	defaultFill4: 'var(--app-fill-2)'
};


export function appChannelListIconFillClassName(isEmphasized: boolean): string {
	return isEmphasized
		? '[--app-fill-1:var(--bg-icon-theme-active)] [--app-fill-2:var(--bg-theme-secounnd)]'
		: '[--app-fill-1:var(--bg-icon-theme)] [--app-fill-2:var(--bg-theme-secounnd)] group-hover:[--app-fill-1:var(--bg-icon-theme-active)] group-hover:[--app-fill-2:var(--bg-theme-secounnd)]';
}

type AppChannelListIconProps = Omit<ComponentProps<typeof Icons.AppChannelIcon>, 'defaultFill1' | 'defaultFill2' | 'defaultFill3' | 'defaultFill4'> & {
	isEmphasized: boolean;
};


export const AppChannelListIcon = memo(function AppChannelListIcon({ isEmphasized, className = 'w-5 h-5', ...props }: AppChannelListIconProps) {
	return (
		<Icons.AppChannelIcon
			className={`${className} ${appChannelListIconFillClassName(isEmphasized)}`.trim()}
			{...VAR_FILLS}
			{...props}
		/>
	);
});
