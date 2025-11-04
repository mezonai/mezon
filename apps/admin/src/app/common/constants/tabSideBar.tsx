export interface ITabs {
	name: string;
	routerLink: string;
	imgSrc?: string;
	isButton?: boolean;
	icon?: React.JSX.Element;
	isExternal?: boolean;
}

export const getSidebarTabs = (t: (key: string) => string): ITabs[] => [
	{ name: t('sidebarTabs.applications'), routerLink: 'applications' },
	// { name: t('sidebarTabs.teams'), routerLink: 'teams' },
	// { name: t('sidebarTabs.embedDebugger'), routerLink: 'embeds' },
	{ name: t('sidebarTabs.document'), routerLink: 'https://mezon.ai/docs', isExternal: true }
];
