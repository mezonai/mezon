export interface ITabs {
	name: string;
	routerLink: string;
	imgSrc?: string;
	isButton?: boolean;
	icon?: React.JSX.Element;
	isExternal?: boolean;
}

export const tabs: ITabs[] = [
	{ name: 'Applications', routerLink: 'applications' },
	{ name: 'Teams', routerLink: 'teams' },
	{ name: 'Embed Debugger', routerLink: 'embeds' },
	{ name: 'Document', routerLink: 'https://mezon.ai/docs', isExternal: true }
];
