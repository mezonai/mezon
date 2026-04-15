export type ItemObjProps = {
	id: string;
	name: string;
};

// Translation keys for i18n
export const ITEM_TRANSLATION_KEYS = {
	OVERVIEW: 'overview',
	ROLES: 'roles',
	CATEGORY_ORDER: 'categoryOrder',
	INTEGRATIONS: 'integrations',
	AUDIT_LOG: 'auditLog',
	ON_BOARDING: 'onboarding',
	ON_COMUNITY: 'enableCommunity',
	EMOJI: 'emoji',
	IMAGE_STICKERS: 'imageStickers',
	VOIDE_STICKERS: 'voiceStickers',
	EMOTIONS: 'emotions',
	APPS: 'apps',
	MODERATION: 'moderation'
} as const;

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
	ARCHIVED_CHANNELS: 'archived-channels',
	AUDIT_LOG: 'audit-log',
	ON_BOARDING: 'on-boarding',
	ON_COMUNITY: 'on-comunity'
};

// Helper function to create translated list items
export const createTranslatedListItemSetting = (t: (key: string) => string): ItemObjProps[] => [
	{ id: ItemSetting.OVERVIEW, name: getTranslatedItemName(ItemSetting.OVERVIEW, t) },
	{ id: ItemSetting.ROLES, name: getTranslatedItemName(ItemSetting.ROLES, t) },
	{ id: ItemSetting.CATEGORY_ORDER, name: getTranslatedItemName(ItemSetting.CATEGORY_ORDER, t) }
];

// Keep original for backward compatibility (will be removed later)
export const listItemSetting: ItemObjProps[] = [
	{ id: ItemSetting.OVERVIEW, name: 'Overview' },
	{ id: ItemSetting.ROLES, name: 'Roles' },
	{ id: ItemSetting.CATEGORY_ORDER, name: 'Category Order' },
	{ id: ItemSetting.ARCHIVED_CHANNELS, name: 'Archived Channels' }
];

// Helper function to get translated names
export const getTranslatedItemName = (id: string, t: (key: string) => string): string => {
	const translationMap: Record<string, string> = {
		[ItemSetting.OVERVIEW]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.OVERVIEW}`),
		[ItemSetting.ROLES]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.ROLES}`),
		[ItemSetting.CATEGORY_ORDER]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.CATEGORY_ORDER}`),
		[ItemSetting.ARCHIVED_CHANNELS]: t('sidebar.items.archivedChannels'),
		[ItemSetting.INTEGRATIONS]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.INTEGRATIONS}`),
		[ItemSetting.AUDIT_LOG]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.AUDIT_LOG}`),
		[ItemSetting.ON_BOARDING]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.ON_BOARDING}`),
		[ItemSetting.ON_COMUNITY]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.ON_COMUNITY}`),
		[ItemSetting.EMOJI]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.EMOJI}`),
		[ItemSetting.IMAGE_STICKERS]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.IMAGE_STICKERS}`),
		[ItemSetting.VOIDE_STICKERS]: t(`sidebar.items.${ITEM_TRANSLATION_KEYS.VOIDE_STICKERS}`)
	};
	return translationMap[id] || id;
};

export const getTranslatedTitle = (title: string, t: (key: string) => string): string => {
	const titleMap: Record<string, string> = {
		Emotions: t(`sidebar.sectionTitles.${ITEM_TRANSLATION_KEYS.EMOTIONS}`),
		Apps: t(`sidebar.sectionTitles.${ITEM_TRANSLATION_KEYS.APPS}`),
		Moderation: t(`sidebar.sectionTitles.${ITEM_TRANSLATION_KEYS.MODERATION}`)
	};
	return titleMap[title] || title;
};

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
