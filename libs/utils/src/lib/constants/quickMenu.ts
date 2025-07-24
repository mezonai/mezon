export const QUICK_MENU_TYPE = {
	QUICK_MESSAGE: 1,
	BOT_EVENT: 2
} as const;

export type QuickMenuType = (typeof QUICK_MENU_TYPE)[keyof typeof QUICK_MENU_TYPE];

export const QUICK_MENU_TYPE_OPTIONS = [
	{ value: QUICK_MENU_TYPE.QUICK_MESSAGE, label: 'Quick Message' },
	{ value: QUICK_MENU_TYPE.BOT_EVENT, label: 'Bot Event' }
];

export const getQuickMenuTypeLabel = (type?: number) => {
	return QUICK_MENU_TYPE_OPTIONS.find((option) => option.value === type)?.label || 'Quick Message';
};

export const getQuickMenuActionFieldLabels = (menuType?: number) => {
	if (menuType === QUICK_MENU_TYPE.BOT_EVENT) {
		return {
			label: 'Event Type',
			placeholder: 'Event type to be sent',
			description: 'Data that will be sent when this bot event is triggered'
		};
	}
	return {
		label: 'Action Message',
		placeholder: 'Message to be sent when command is used',
		description: 'Message content that will be inserted when this command is selected'
	};
};
