import { MezonIcon, MzIcons16 } from '@mezon/ui';
import type { IClan } from '@mezon/utils';

export type SidebarTooltipProps = {
	titleTooltip?: string;
	readonly children: React.ReactElement;
	clan?: IClan;
};

const SidebarTooltip = ({ titleTooltip, clan, children }: SidebarTooltipProps) => {
	return <div>{children}</div>;
};

const OnboardingIcon = () => {
	return (
		<div className="relative h-4 w-4">
			<MezonIcon icon={MzIcons16.mzClanBadge} className="text-white" />
		</div>
	);
};
export default SidebarTooltip;
