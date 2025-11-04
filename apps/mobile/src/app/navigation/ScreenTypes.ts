import type { ETypeSearch, ICategoryChannelOption } from '@mezon/mobile-components';
import type {
	ChannelMembersEntity,
	ChannelsEntity,
	DirectEntity,
	EventManagementEntity,
	NotiChannelCategorySettingEntity,
	RolesClanEntity
} from '@mezon/store-mobile';
import type { ChannelThreads, ICategoryChannel, IChannel, IMessageWithUser, OptionEvent } from '@mezon/utils';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ApiWebhook } from 'mezon-js/api.gen';

export const APP_SCREEN = {
	UN_AUTHORIZE: 'UN_AUTHORIZE',
	LOGIN: 'LOGIN',
	WELCOME: 'WELCOME',
	REGISTER: 'REGISTER',
	APP_BROWSER: 'APP_BROWSER',
	VERIFY_OTP: 'VERIFY_OTP',

	AUTHORIZE: 'AUTHORIZE',
	BOTTOM_BAR: 'BOTTOM_BAR',
	DRAWER_BAR: 'DRAWER_BAR',
	HOME_DEFAULT: 'HOME_DEFAULT',
	HOME: 'HOME',
	VIDEO_DETAIL: 'VIDEO_DETAIL',
	CHANNEL_APP: 'CHANNEL_APP',
	INVITE_CLAN: 'INVITE_CLAN',
	WALLET: 'WALLET',
	PROFILE_DETAIL: 'PROFILE_DETAIL',
	INSTALL_CLAN: 'INSTALL_CLAN',

	SERVERS: {
		STACK: 'ROUTES.SERVERS.STACK',
		HOME: 'ROUTES.SERVERS.HOME',
		UPDATE_GATE: 'UPDATE_GATE'
	},

	NOTIFICATION: {
		STACK: 'ROUTES.NOTIFICATION.STACK',
		HOME: 'ROUTES.NOTIFICATION.HOME',
		DETAIL: 'ROUTES.NOTIFICATION.DETAIL'
	},

	MESSAGES: {
		STACK: 'ROUTES.MESSAGES.STACK',
		HOME: 'ROUTES.MESSAGES.HOME',
		MESSAGE_DETAIL: 'ROUTES.MESSAGES.MESSAGE_DETAIL',
		NEW_MESSAGE: 'ROUTES.MESSAGES.NEW_MESSAGE',
		NEW_GROUP: 'ROUTES.MESSAGES.NEW_GROUP',
		CHAT_STREAMING: 'ROUTES.MESSAGES.CHAT_STREAMING',
		TOPIC_DISCUSSION: 'ROUTES.MESSAGES.TOPIC_DISCUSSION',
		CHANNEL_APP: 'ROUTES.MESSAGES.CHANNEL_APP',
		INVITE_CLAN: 'ROUTES.MESSAGES.INVITE_CLAN',
		FORWARD_MESSAGE: 'ROUTES.MESSAGES.FORWARD_MESSAGE'
	},

	FRIENDS: {
		STACK: 'ROUTES.FRIENDS.STACK',
		HOME: 'ROUTES.FRIENDS.HOME',
		ADD_FRIEND: 'ROUTES.FRIENDS.ADD_FRIEND',
		REQUEST_FRIEND: 'ROUTES.FRIENDS.REQUEST_FRIEND',
		REQUEST_FRIEND_SETTING: 'ROUTES.FRIENDS.REQUEST_FRIEND_SETTING'
	},

	PROFILE: {
		STACK: 'ROUTES.PROFILE.STACK',
		HOME: 'ROUTES.PROFILE.HOME'
	},

	SHOP: {
		STACK: 'ROUTES.SHOP.STACK',
		HOME: 'ROUTES.SHOP.HOME'
	},

	MENU_THREAD: {
		STACK: 'ROUTES.MENU_THREAD.STACK',
		BOTTOM_SHEET: 'ROUTES.MENU_THREAD.BOTTOM_SHEET',
		CREATE_THREAD: 'ROUTES.MENU_THREAD.CREATE_THREAD',
		CREATE_THREAD_FORM_MODAL: 'ROUTES.MENU_THREAD.CREATE_THREAD_FORM_MODAL',
		MUTE_THREAD_DETAIL_CHANNEL: 'ROUTES.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL',
		MUTE_CATEGORY_DETAIL: 'ROUTES.MENU_THREAD.MUTE_CATEGORY_DETAIL'
	},

	MENU_CLAN: {
		STACK: 'ROUTES.MENU_CLAN.STACK',
		CREATE_CATEGORY: 'ROUTES.MENU_CLAN.CREATE_CATEGORY',
		CREATE_CHANNEL: 'ROUTES.MENU_CLAN.CREATE_CHANNEL',
		CREATE_EVENT: 'ROUTES.MENU_CLAN.CREATE_EVENT',
		CREATE_EVENT_DETAILS: 'ROUTES.MENU_CLAN.CREATE_EVENT_DETAILS',
		CREATE_EVENT_PREVIEW: 'ROUTES.MENU_CLAN.CREATE_EVENT_PREVIEW',
		SETTINGS: 'ROUTES.MENU_CLAN.SETTINGS',
		OVERVIEW_SETTING: 'ROUTES.MENU_CLAN.OVERVIEW_SETTING',
		EMOJI_SETTING: 'ROUTES.MENU_CLAN.EMOJI_SETTING',
		STICKER_SETTING: 'ROUTES.MENU_CLAN.STICKER_SETTING',
		MEMBER_SETTING: 'ROUTES.MENU_CLAN.MEMBER_SETTING',
		ROLE_SETTING: 'ROUTES.MENU_CLAN.ROLE_SETTING',
		CREATE_NEW_ROLE: 'ROUTES.MENU_CLAN.CREATE_NEW_ROLE',
		SETUP_ROLE_MEMBERS: 'ROUTES.MENU_CLAN.SETUP_ROLE_MEMBERS',
		SETUP_PERMISSIONS: 'ROUTES.MENU_CLAN.SETUP_PERMISSIONS',
		ROLE_DETAIL: 'ROUTES.MENU_CLAN.ROLE_DETAIL',
		NOTIFICATION_SETTING: 'ROUTES.MENU_CLAN.NOTIFICATION_SETTING',
		NOTIFICATION_OVERRIDES: 'ROUTES.MENU_CLAN.NOTIFICATION_OVERRIDES',
		NOTIFICATION_SETTING_DETAIL: 'ROUTES.MENU_CLAN.NOTIFICATION_SETTING_DETAIL',
		CATEGORY_SETTING: 'ROUTES.MENU_CLAN.CATEGORY_SETTING',
		INTEGRATIONS: 'INTEGRATIONS',
		WEBHOOKS: 'WEBHOOKS',
		WEBHOOKS_EDIT: 'WEBHOOKS_EDIT',
		AUDIT_LOG: 'AUDIT_LOG',
		FILTER_BY_USER: 'FILTER_BY_USER',
		FILTER_BY_ACTION: 'FILTER_BY_ACTION',
		SOUND_STICKER: 'ROUTES.MENU_CLAN.SOUND_STICKER',
		CREATE_SOUND: 'ROUTES.MENU_CLAN.CREATE_SOUND',
		TRANSFER_OWNERSHIP: 'ROUTES.MENU_CLAN.TRANSFER_OWNERSHIP',
		MANAGE_USER: 'ROUTES.MENU_CLAN.MANAGE_USER',
		ENABLE_COMMUNITY: 'ROUTES.MENU_CLAN.ENABLE_COMMUNITY'
	},

	MENU_CHANNEL: {
		STACK: 'ROUTES.MENU_CHANNEL.STACK',
		SETTINGS: 'ROUTES.MENU_CHANNEL.SETTINGS',
		SEARCH_MESSAGE_CHANNEL: 'SEARCH_MESSAGE_CHANNEL',
		CHANNEL_PERMISSION: 'CHANNEL_PERMISSION',
		CHANGE_CATEGORY: 'CHANGE_CATEGORY',
		ADVANCED_PERMISSION_OVERRIDES: 'ADVANCED_PERMISSION_OVERRIDES',
		SEARCH_MESSAGE_DM: 'SEARCH_MESSAGE_DM',
		CANVAS: 'CANVAS',
		CALL_DIRECT: 'CALL_DIRECT',
		QUICK_ACTION: 'QUICK_ACTION',
		STREAM_BANNER: 'STREAM_BANNER'
	},

	SETTINGS: {
		STACK: 'ROUTES.SETTINGS.STACK',
		HOME: 'ROUTES.SETTINGS.HOME',
		LANGUAGE: 'ROUTES.SETTINGS.LANGUAGE',
		PROFILE: 'ROUTES.SETTINGS.PROFILE',
		SHARING: 'ROUTES.SETTINGS.SHARING',
		QR_SCANNER: 'ROUTES.SETTINGS.QR_SCANNER',
		APPEARANCE: 'ROUTES.SETTINGS.APPEARANCE',
		APP_THEME: 'ROUTES.SETTINGS.APP_THEME',
		ACCOUNT: 'ROUTES.SETTINGS.ACCOUNT',
		BLOCKED_USERS: 'ROUTES.SETTINGS.BLOCKED_USERS',
		SEND_COFFEE: 'ROUTES.SETTINGS.SEND_COFFEE',
		MY_QR_CODE: 'ROUTES.SETTINGS.MY_QR_CODE',
		SET_PASSWORD: 'ROUTES.SETTINGS.SET_PASSWORD',
		UPDATE_PHONE_NUMBER: 'ROUTES.SETTINGS.UPDATE_PHONE_NUMBER',
		VERIFY_PHONE_NUMBER: 'ROUTES.SETTINGS.VERIFY_PHONE_NUMBER'
	}
} as const;

type ServerStackParamList = {
	[APP_SCREEN.SERVERS.HOME]: undefined;
};

type NotificationStackParamList = {
	[APP_SCREEN.NOTIFICATION.HOME]: { initialTab?: string; version?: number };
	[APP_SCREEN.NOTIFICATION.DETAIL]: undefined;
};

type MessagesStackParamList = {
	[APP_SCREEN.MESSAGES.HOME]: undefined;
	[APP_SCREEN.MESSAGES.MESSAGE_DETAIL]: undefined;
	[APP_SCREEN.MESSAGES.NEW_MESSAGE]: undefined;
	[APP_SCREEN.MESSAGES.NEW_GROUP]: undefined;
	[APP_SCREEN.MESSAGES.CHAT_STREAMING]: undefined;
	[APP_SCREEN.MESSAGES.TOPIC_DISCUSSION]: undefined;
	[APP_SCREEN.MESSAGES.FORWARD_MESSAGE]: {
		message: IMessageWithUser;
		isPublic?: boolean;
	};
};

type FriendsStackParamList = {
	[APP_SCREEN.FRIENDS.HOME]: undefined;
	[APP_SCREEN.FRIENDS.ADD_FRIEND]: undefined;
	[APP_SCREEN.FRIENDS.REQUEST_FRIEND]: undefined;
	[APP_SCREEN.FRIENDS.REQUEST_FRIEND_SETTING]: undefined;
};

type ProfileStackParamList = {
	[APP_SCREEN.PROFILE.HOME]: undefined;
};

type ShopStackParamList = {
	[APP_SCREEN.SHOP.HOME]: undefined;
};

type MenuThreadStackParamList = {
	[APP_SCREEN.MENU_THREAD.BOTTOM_SHEET]: undefined;
	[APP_SCREEN.MENU_THREAD.CREATE_THREAD]: {
		channelThreads: ChannelThreads;
	};
	[APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL]: { channelThreads: ChannelThreads };
	[APP_SCREEN.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL]: { currentChannel: IChannel | DirectEntity; isCurrentChannel: boolean };
	[APP_SCREEN.MENU_THREAD.MUTE_CATEGORY_DETAIL]: { currentCategory: ICategoryChannel };
};

export type MenuChannelStackParamList = {
	[APP_SCREEN.MENU_CHANNEL.SETTINGS]: {
		channelId: string;
	};
	[APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL]: {
		typeSearch: ETypeSearch;
		currentChannel: IChannel | DirectEntity;
		nameChannel?: string;
		isClearSearch?: boolean;
	};
	[APP_SCREEN.MENU_CHANNEL.CHANNEL_PERMISSION]: {
		channelId: string;
	};
	[APP_SCREEN.MENU_CHANNEL.CHANGE_CATEGORY]: {
		channel: ChannelsEntity;
	};
	[APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES]: {
		channelId: string;
		clanId: string;
		id: string;
		type?: number;
	};
	[APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_DM]: {
		currentChannel: IChannel | DirectEntity;
	};
	[APP_SCREEN.MENU_CHANNEL.CANVAS]: {
		clanId: string;
		channelId: string;
		canvasId: string;
	};
	[APP_SCREEN.MENU_CHANNEL.QUICK_ACTION]: {
		channelId: string;
	};
	[APP_SCREEN.MENU_CHANNEL.STREAM_BANNER]: {
		channelId: string;
	};
};

type MenuClanStackParamList = {
	[APP_SCREEN.MENU_CLAN.CREATE_CATEGORY]: undefined;
	[APP_SCREEN.MENU_CLAN.CREATE_CHANNEL]: {
		categoryId: string;
	};
	[APP_SCREEN.MENU_CLAN.CREATE_EVENT]: {
		onGoBack?: () => void;
		eventId?: string;
	};
	[APP_SCREEN.MENU_CLAN.CREATE_EVENT_DETAILS]: {
		type: OptionEvent;
		channelId: string;
		location: string;
		eventChannelId: string;
		isPrivate?: boolean;
		onGoBack?: () => void;
		currentEvent?: EventManagementEntity;
	};
	[APP_SCREEN.MENU_CLAN.CREATE_EVENT_PREVIEW]: {
		type: OptionEvent;
		channelId: string;
		location: string;
		startTime: Date;
		endTime: Date;
		title: string;
		description: string;
		frequency: number;
		eventChannelId: string;
		isPrivate?: boolean;
		logo?: string;
		onGoBack?: () => void;
		currentEvent?: EventManagementEntity;
	};
	[APP_SCREEN.MENU_CLAN.SETTINGS]: { inviteRef: React.MutableRefObject<any> };
	[APP_SCREEN.MENU_CLAN.OVERVIEW_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.EMOJI_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.STICKER_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.MEMBER_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.ROLE_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.CREATE_NEW_ROLE]: undefined;
	[APP_SCREEN.MENU_CLAN.AUDIT_LOG]: undefined;
	[APP_SCREEN.MENU_CLAN.FILTER_BY_ACTION]: undefined;
	[APP_SCREEN.MENU_CLAN.FILTER_BY_USER]: undefined;
	[APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS]: {
		roleId: string;
	};
	[APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS]: {
		roleId: string;
	};
	[APP_SCREEN.MENU_CLAN.ROLE_DETAIL]: {
		role: RolesClanEntity;
	};
	[APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.NOTIFICATION_OVERRIDES]: undefined;
	[APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING_DETAIL]: {
		notifyChannelCategorySetting: NotiChannelCategorySettingEntity | ICategoryChannelOption;
	};
	[APP_SCREEN.MENU_CLAN.CATEGORY_SETTING]: {
		categoryId: string;
	};
	[APP_SCREEN.MENU_CLAN.INTEGRATIONS]: { channelId?: string; isClanSetting?: boolean };
	[APP_SCREEN.MENU_CLAN.WEBHOOKS]: { channelId?: string; clanId?: string; isClanSetting?: boolean; isClanIntegration?: boolean };
	[APP_SCREEN.MENU_CLAN.WEBHOOKS_EDIT]: {
		webhook: ApiWebhook;
		isClanIntegration?: boolean;
		isClanSetting?: boolean;
	};
	[APP_SCREEN.MENU_CLAN.SOUND_STICKER]: undefined;
	[APP_SCREEN.MENU_CLAN.CREATE_SOUND]: undefined;
	[APP_SCREEN.MENU_CLAN.TRANSFER_OWNERSHIP]: {
		user: ChannelMembersEntity;
	};
	[APP_SCREEN.MENU_CLAN.MANAGE_USER]: {
		user: ChannelMembersEntity;
	};
	[APP_SCREEN.MENU_CLAN.ENABLE_COMMUNITY]: undefined;
};

type SettingStackParamList = {
	[APP_SCREEN.SETTINGS.HOME]: undefined;
	[APP_SCREEN.SETTINGS.LANGUAGE]: undefined;
	[APP_SCREEN.SETTINGS.PROFILE]: { profileTab?: number };
	[APP_SCREEN.SETTINGS.APPEARANCE]: undefined;
	[APP_SCREEN.SETTINGS.APP_THEME]: undefined;
	[APP_SCREEN.SETTINGS.ACCOUNT]: undefined;
	[APP_SCREEN.SETTINGS.BLOCKED_USERS]: undefined;
	[APP_SCREEN.SETTINGS.MY_QR_CODE]: undefined;
	[APP_SCREEN.SETTINGS.SET_PASSWORD]: undefined;
	[APP_SCREEN.SETTINGS.UPDATE_PHONE_NUMBER]: {
		currentPhone?: string;
	};
	[APP_SCREEN.SETTINGS.VERIFY_PHONE_NUMBER]: undefined;
};

type ChannelAppParamList = {
	[APP_SCREEN.CHANNEL_APP]: {
		channelId?: string;
		clanId?: string;
		code?: string;
		subpath?: string;
	};
};

export type AppStackParamList = {
	[APP_SCREEN.UN_AUTHORIZE]: undefined;
	[APP_SCREEN.LOGIN]: undefined;
	[APP_SCREEN.VERIFY_OTP]: undefined;
	[APP_SCREEN.REGISTER]: undefined;
	[APP_SCREEN.APP_BROWSER]: { url: string; title?: string };
	[APP_SCREEN.AUTHORIZE]: undefined;
	[APP_SCREEN.BOTTOM_BAR]: undefined;
	[APP_SCREEN.DRAWER_BAR]: undefined;
	[APP_SCREEN.HOME]: undefined;
	[APP_SCREEN.HOME_DEFAULT]: undefined;
	[APP_SCREEN.PROFILE_DETAIL]: { username?: string; data?: string };
	[APP_SCREEN.SERVERS.STACK]: NavigatorScreenParams<ServerStackParamList>;
	[APP_SCREEN.NOTIFICATION.STACK]: NavigatorScreenParams<NotificationStackParamList>;
	[APP_SCREEN.MESSAGES.STACK]: NavigatorScreenParams<MessagesStackParamList>;
	[APP_SCREEN.FRIENDS.STACK]: NavigatorScreenParams<FriendsStackParamList>;
	[APP_SCREEN.PROFILE.STACK]: NavigatorScreenParams<ProfileStackParamList>;
	[APP_SCREEN.SHOP.STACK]: NavigatorScreenParams<ShopStackParamList>;
	[APP_SCREEN.MENU_THREAD.STACK]: NavigatorScreenParams<MenuThreadStackParamList>;
	[APP_SCREEN.MENU_CHANNEL.STACK]: NavigatorScreenParams<MenuChannelStackParamList>;
	[APP_SCREEN.MENU_CLAN.STACK]: NavigatorScreenParams<MenuClanStackParamList>;
	[APP_SCREEN.SETTINGS.STACK]: NavigatorScreenParams<SettingStackParamList>;
	[APP_SCREEN.CHANNEL_APP]: NavigatorScreenParams<ChannelAppParamList>;
};

export type AppStackScreenProps<T extends keyof AppStackParamList = typeof APP_SCREEN.HOME> = StackScreenProps<AppStackParamList, T>;

export type MenuClanScreenProps<T extends keyof MenuClanStackParamList> = CompositeScreenProps<
	NativeStackScreenProps<MenuClanStackParamList, T>,
	AppStackScreenProps<keyof AppStackParamList>
>;

export type MenuChannelScreenProps<T extends keyof MenuChannelStackParamList> = CompositeScreenProps<
	NativeStackScreenProps<MenuChannelStackParamList, T>,
	AppStackScreenProps<keyof AppStackParamList>
>;

export type SettingScreenProps<T extends keyof SettingStackParamList> = CompositeScreenProps<
	NativeStackScreenProps<SettingStackParamList, T>,
	AppStackScreenProps<keyof AppStackParamList>
>;

export type MenuThreadScreenProps<T extends keyof MenuThreadStackParamList> = CompositeScreenProps<
	NativeStackScreenProps<MenuThreadStackParamList, T>,
	AppStackScreenProps<keyof AppStackParamList>
>;
