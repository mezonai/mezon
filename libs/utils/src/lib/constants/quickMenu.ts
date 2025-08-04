export const QUICK_MENU_TYPE = {
	FLASH_MESSAGE: 1,
	QUICK_MENU: 2
} as const;

export type QuickMenuType = (typeof QUICK_MENU_TYPE)[keyof typeof QUICK_MENU_TYPE];

export const QUICK_MENU_TYPE_OPTIONS = [
	{ value: QUICK_MENU_TYPE.FLASH_MESSAGE, label: 'Flash Message' },
	{ value: QUICK_MENU_TYPE.QUICK_MENU, label: 'Quick Menu' }
];

export const getQuickMenuTypeLabel = (type?: number) => {
	return QUICK_MENU_TYPE_OPTIONS.find((option) => option.value === type)?.label || 'Flash Message';
};

export const getQuickMenuActionFieldLabels = (menuType?: number) => {
	if (menuType === QUICK_MENU_TYPE.QUICK_MENU) {
		return {
			label: 'Menu Action',
			placeholder: 'Action to be executed',
			description: 'Action that will be executed when this quick menu is selected'
		};
	}
	return {
		label: 'Message Content',
		placeholder: 'Message to be sent quickly',
		description: 'Message content that will be sent when this flash message command is used'
	};
};
