import { Icons } from '@mezon/ui';
import { ITabs } from './tabSideBar';

export const appDetailTabs: ITabs[] = [
	{ name: 'General Information', routerLink: 'information', icon: <Icons.AdminHomeIcon /> },
	{ name: 'Installation', routerLink: 'installation', icon: <Icons.AdminSettingIcon /> },
	{ name: 'OAuth2', routerLink: 'oauth2', icon: <Icons.OAuth2Setting /> },
	{ name: 'Flow', routerLink: 'flow', icon: <Icons.ToolIcon /> },
	{
		name: 'Flow Examples',
		routerLink: 'flow-examples',
		icon: (
			<div className="w-[20px] mx-[2px]">
				<Icons.SortBySmallSizeBtn className="w-full h-fit" />
			</div>
		)
	}
];
