import { Icons } from '@mezon/ui';
import type { ITabs } from './tabSideBar';

export const getAppDetailTabs = (t: (key: string) => string): ITabs[] => [
	{ name: t('tabs.generalInformation'), routerLink: 'information', icon: <Icons.AdminHomeIcon /> },
	{ name: t('tabs.installation'), routerLink: 'installation', icon: <Icons.AdminSettingIcon /> },
	{ name: t('tabs.oauth2'), routerLink: 'oauth2', icon: <Icons.OAuth2Setting /> }
];
