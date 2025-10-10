export type ItemObjProps = {
	id: string;
	name: string;
};

export type ListSideBarProps = {
	title: string;
	listItem: ItemObjProps[];
};

export const ItemSetting = {
	OVERVIEW: 'overview',
	ROLES: 'roles',
	EMOJI: 'emoji',
	IMAGE_STICKERS: 'Stickers',
	VOIDE_STICKERS: 'upload-sound',
	DELETE_SERVER: 'delete_server',
	INTEGRATIONS: 'integrations',
	// NOTIFICATION_SOUND: 'notification-sound',
	CATEGORY_ORDER: 'category-order',
	AUDIT_LOG: 'audit-log',
	ON_BOARDING: 'on-boarding',
	ON_COMUNITY: 'on-comunity'
};

export const listItemSetting: ItemObjProps[] = [
	{ id: ItemSetting.OVERVIEW, name: 'Overview' },
	{ id: ItemSetting.ROLES, name: 'Roles' },
	{ id: ItemSetting.CATEGORY_ORDER, name: 'Category Order' }
];

export const listItemSettingApp: ItemObjProps[] = [{ id: ItemSetting.INTEGRATIONS, name: 'Integrations' }];

export const listItemSettingModeration: ItemObjProps[] = [{ id: ItemSetting.AUDIT_LOG, name: 'Audit Log' }];
export const communitySettingsList: ItemObjProps[] = [
	{ id: ItemSetting.ON_BOARDING, name: 'Onboarding' },
	{ id: ItemSetting.ON_COMUNITY, name: 'Enable Community' }
];

export const listItemEmotions: ItemObjProps[] = [
	{ id: ItemSetting.EMOJI, name: 'Emoji' },
	{ id: ItemSetting.IMAGE_STICKERS, name: 'Image Stickers' },
	{ id: ItemSetting.VOIDE_STICKERS, name: 'Voice Stickers' }
];

export const sideBarListItem: ListSideBarProps[] = [
	{
		title: '',
		listItem: listItemSetting
	},
	{
		title: 'Emotions',
		listItem: listItemEmotions
	},
	{
		title: 'Apps',
		listItem: listItemSettingApp
	},
	{
		title: 'Moderation',
		listItem: listItemSettingModeration
	},
	{
		title: '',
		listItem: communitySettingsList
	}
];

export const listItemSettingClanPermission: ItemObjProps[] = [
	{ id: ItemSetting.OVERVIEW, name: 'Overview' },
	{ id: ItemSetting.EMOJI, name: 'Emoji' },
	{ id: ItemSetting.IMAGE_STICKERS, name: 'Image Stickers' },
	{ id: ItemSetting.VOIDE_STICKERS, name: 'Voice Sticker' }
	// { id: ItemSetting.NOTIFICATION_SOUND, name: 'Notification Sound' }
];

export const sideBarListItemClanPermission: ListSideBarProps[] = [
	{
		title: '',
		listItem: listItemSettingClanPermission
	},
	{
		title: 'Apps',
		listItem: listItemSettingApp
	}
];

export const categorySettingItem = {
	OVERVIEW: 'overview'
};

export const categorySettingList = [{ id: categorySettingItem.OVERVIEW, name: 'Overview' }];
