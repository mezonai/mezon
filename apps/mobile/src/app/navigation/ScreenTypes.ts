import { EOpenSearchChannelFrom, ICategoryChannelOption } from '@mezon/mobile-components';
import { ChannelsEntity, DirectEntity, NotiChannelCategorySettingEntity } from '@mezon/store-mobile';
import { ChannelThreads, IChannel, OptionEvent } from '@mezon/utils';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackScreenProps } from '@react-navigation/stack';
import { ApiWebhook } from 'mezon-js/api.gen';

export const APP_SCREEN = {
	UN_AUTHORIZE: 'UN_AUTHORIZE',
	LOGIN: 'LOGIN',
	REGISTER: 'REGISTER',

	AUTHORIZE: 'AUTHORIZE',
	BOTTOM_BAR: 'BOTTOM_BAR',
	DRAWER_BAR: 'DRAWER_BAR',
	HOME_DEFAULT: 'HOME_DEFAULT',
	HOME: 'HOME',

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
		NEW_GROUP: 'ROUTES.MESSAGES.NEW_GROUP'
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

	MENU_THREAD: {
		STACK: 'ROUTES.MENU_THREAD.STACK',
		BOTTOM_SHEET: 'ROUTES.MENU_THREAD.BOTTOM_SHEET',
		CREATE_THREAD: 'ROUTES.MENU_THREAD.CREATE_THREAD',
		CREATE_THREAD_FORM_MODAL: 'ROUTES.MENU_THREAD.CREATE_THREAD_FORM_MODAL',
		MUTE_THREAD_DETAIL_CHANNEL: 'ROUTES.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL'
	},

	MENU_CLAN: {
		STACK: 'ROUTES.MENU_CLAN.STACk',
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
		WEBHOOKS_EDIT: 'WEBHOOKS_EDIT'
	},

	MENU_CHANNEL: {
		STACK: 'ROUTES.MENU_CHANNEL.STACk',
		SETTINGS: 'ROUTES.MENU_CHANNEL.SETTINGS',
		SEARCH_MESSAGE_CHANNEL: 'SEARCH_MESSAGE_CHANNEL',
		CHANNEL_PERMISSION: 'CHANNEL_PERMISSION',
		CHANGE_CATEGORY: 'CHANGE_CATEGORY',
		ADVANCED_PERMISSION_OVERRIDES: 'ADVANCED_PERMISSION_OVERRIDES'
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
		BLOCKED_USERS: 'ROUTES.SETTINGS.BLOCKED_USERS'
	}
} as const;

type ServerStackParamList = {
	[APP_SCREEN.SERVERS.HOME]: undefined;
};

type NotificationStackParamList = {
	[APP_SCREEN.NOTIFICATION.HOME]: undefined;
	[APP_SCREEN.NOTIFICATION.DETAIL]: undefined;
};

type MessagesStackParamList = {
	[APP_SCREEN.MESSAGES.HOME]: undefined;
	[APP_SCREEN.MESSAGES.MESSAGE_DETAIL]: undefined;
	[APP_SCREEN.MESSAGES.NEW_MESSAGE]: undefined;
	[APP_SCREEN.MESSAGES.NEW_GROUP]: undefined;
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

type MenuThreadStackParamList = {
	[APP_SCREEN.MENU_THREAD.BOTTOM_SHEET]: undefined;
	[APP_SCREEN.MENU_THREAD.CREATE_THREAD]: {
		channelThreads: ChannelThreads;
	};
	[APP_SCREEN.MENU_THREAD.CREATE_THREAD_FORM_MODAL]: { channelThreads: ChannelThreads };
	[APP_SCREEN.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL]: { currentChannel: IChannel | DirectEntity; isCurrentChannel: boolean };
};

export type MenuChannelStackParamList = {
	[APP_SCREEN.MENU_CHANNEL.SETTINGS]: {
		channelId: string;
	};
	[APP_SCREEN.MENU_CHANNEL.SEARCH_MESSAGE_CHANNEL]: {
		openSearchChannelFrom: EOpenSearchChannelFrom;
		currentChannel: IChannel | DirectEntity;
	};
	[APP_SCREEN.MENU_CHANNEL.CHANNEL_PERMISSION]: {
		channelId: string;
	};
	[APP_SCREEN.MENU_CHANNEL.CHANGE_CATEGORY]: {
		channel: ChannelsEntity;
	};
	[APP_SCREEN.MENU_CHANNEL.ADVANCED_PERMISSION_OVERRIDES]: {
		channelId: string;
		id: string;
		type?: number;
	};
};

type MenuClanStackParamList = {
	[APP_SCREEN.MENU_CLAN.CREATE_CATEGORY]: undefined;
	[APP_SCREEN.MENU_CLAN.CREATE_CHANNEL]: {
		categoryId: string;
	};
	[APP_SCREEN.MENU_CLAN.CREATE_EVENT]: {
		onGoBack?: () => void;
	};
	[APP_SCREEN.MENU_CLAN.CREATE_EVENT_DETAILS]: {
		type: OptionEvent;
		channelId: string;
		location: string;
		onGoBack?: () => void;
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
		onGoBack?: () => void;
	};
	[APP_SCREEN.MENU_CLAN.SETTINGS]: { inviteRef: React.MutableRefObject<any> };
	[APP_SCREEN.MENU_CLAN.OVERVIEW_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.EMOJI_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.STICKER_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.MEMBER_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.ROLE_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.CREATE_NEW_ROLE]: undefined;
	[APP_SCREEN.MENU_CLAN.SETUP_ROLE_MEMBERS]: {
		roleId: string;
	};
	[APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS]: {
		roleId: string;
	};
	[APP_SCREEN.MENU_CLAN.ROLE_DETAIL]: {
		roleId: string;
	};
	[APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING]: undefined;
	[APP_SCREEN.MENU_CLAN.NOTIFICATION_OVERRIDES]: undefined;
	[APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING_DETAIL]: {
		notifyChannelCategorySetting: NotiChannelCategorySettingEntity | ICategoryChannelOption;
	};
	[APP_SCREEN.MENU_CLAN.CATEGORY_SETTING]: {
		categoryId: string;
	};
	[APP_SCREEN.MENU_CLAN.INTEGRATIONS]: undefined;
	[APP_SCREEN.MENU_CLAN.WEBHOOKS]: undefined;
	[APP_SCREEN.MENU_CLAN.WEBHOOKS_EDIT]: {
		webhook: ApiWebhook;
	};
};

type SettingStackParamList = {
	[APP_SCREEN.SETTINGS.HOME]: undefined;
	[APP_SCREEN.SETTINGS.LANGUAGE]: undefined;
	[APP_SCREEN.SETTINGS.PROFILE]: { profileTab?: number };
	[APP_SCREEN.SETTINGS.APPEARANCE]: undefined;
	[APP_SCREEN.SETTINGS.APP_THEME]: undefined;
	[APP_SCREEN.SETTINGS.ACCOUNT]: undefined;
	[APP_SCREEN.SETTINGS.BLOCKED_USERS]: undefined;
};

export type AppStackParamList = {
	[APP_SCREEN.UN_AUTHORIZE]: undefined;
	[APP_SCREEN.LOGIN]: undefined;
	[APP_SCREEN.REGISTER]: undefined;
	[APP_SCREEN.AUTHORIZE]: undefined;
	[APP_SCREEN.BOTTOM_BAR]: undefined;
	[APP_SCREEN.DRAWER_BAR]: undefined;
	[APP_SCREEN.HOME]: undefined;
	[APP_SCREEN.HOME_DEFAULT]: undefined;
	[APP_SCREEN.SERVERS.STACK]: NavigatorScreenParams<ServerStackParamList>;
	[APP_SCREEN.NOTIFICATION.STACK]: NavigatorScreenParams<NotificationStackParamList>;
	[APP_SCREEN.MESSAGES.STACK]: NavigatorScreenParams<MessagesStackParamList>;
	[APP_SCREEN.FRIENDS.STACK]: NavigatorScreenParams<FriendsStackParamList>;
	[APP_SCREEN.PROFILE.STACK]: NavigatorScreenParams<ProfileStackParamList>;
	[APP_SCREEN.MENU_THREAD.STACK]: NavigatorScreenParams<MenuThreadStackParamList>;
	[APP_SCREEN.MENU_CHANNEL.STACK]: NavigatorScreenParams<MenuChannelStackParamList>;
	[APP_SCREEN.MENU_CLAN.STACK]: NavigatorScreenParams<MenuClanStackParamList>;
	[APP_SCREEN.SETTINGS.STACK]: NavigatorScreenParams<SettingStackParamList>;
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
