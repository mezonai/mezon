import { MezonIcon, MzIcons20 } from '@mezon/ui';
import type { ITabs } from './tabSideBar';

export const getAppDetailTabs = (t: (key: string) => string): ITabs[] => [
	{ name: t('tabs.generalInformation'), routerLink: 'information', icon: <MezonIcon icon={MzIcons20.mzHome} /> },
	{ name: t('tabs.installation'), routerLink: 'installation', icon: <MezonIcon icon={MzIcons20.mzSettings} /> },
	{ name: t('tabs.oauth2'), routerLink: 'oauth2', icon: <MezonIcon icon={MzIcons20.mzTools} /> }
];
