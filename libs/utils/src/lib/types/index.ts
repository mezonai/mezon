import { ChannelMessage, ChannelType } from 'mezon-js';
import {
	ApiAccount,
	ApiCategoryDesc,
	ApiChannelDescription,
	ApiClanDesc,
	ApiClanProfile,
	ApiEventManagement,
	ApiInviteUserRes,
	ApiMessageAttachment,
	ApiMessageMention,
	ApiMessageReaction,
	ApiMessageRef,
	ApiPermission,
	ApiRole,
	ApiUser,
	ChannelUserListChannelUser,
	ClanUserListClanUser,
	RoleUserListRoleUser,
	ApiNotificationUserChannel,
	ApiNotificationSetting,
	ApiNotificationChannelCategoySetting,
} from 'mezon-js/api.gen';

export * from './permissions';
export * from './thumbnailPos';

export type LoadingStatus = 'not loaded' | 'loading' | 'loaded' | 'error';

export type IClan = ApiClanDesc & {
	id: string;
};

export type IInvite = ApiInviteUserRes & {
	id: string;
};

export type IClanProfile = ApiClanProfile & {
	id: string;
};
export type ICategory = ApiCategoryDesc & {
	id: string;
};

export type IPermissionUser = ApiPermission & {
	id: string;
};

export type IUsersClan = ClanUserListClanUser & {
	id: string;
};

export type IRolesClan = ApiRole & {
	id: string;
};

export type INotificationSetting = ApiNotificationUserChannel

export type IDefaultNotificationClan = ApiNotificationSetting

export type IDefaultNotificationCategory = ApiNotificationSetting

export type IDefaultNotification = ApiNotificationSetting & {
	id: string;
};
export type IChannelCategorySetting = ApiNotificationChannelCategoySetting & {
	id: string;
};
export type IEventManagement = ApiEventManagement & {
	id: string;
};

export type IUsersRole = RoleUserListRoleUser & {
	id: string;
};

export type ICategoryChannel = ICategory & {
	channels: IChannel[];
};

export type IRole = {
	role_id: string;
};

export type IRoleUsers = IRole & {
	users: ApiUser[];
};

export type ChannelThreads = IChannel & {
	threads: IChannel[];
};

export type IChannel = ApiChannelDescription & {
	id: string;
	unread?: boolean;
	description?: string;
};

export type IChannelMember = ChannelUserListChannelUser & {
	id: string;
	channelId?: string;
	userChannelId?: string;
	user_id?: string; // use on VoiceChannelList
};

export type IThread = {
	name: string | undefined;
	id: string | undefined;
	clanId: string | undefined;
	channelId: string | undefined;
	content: string | undefined;
	date: string | undefined;
};

export type IContextMenuItemAction = 'REST';

export type IContextMenuItemMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type IContextMenuItemPayload = {
	// any
};

export type IContextMenuItemCallback = {
	// any
};

export type IContextMenuItem = {
	label: string;
	icon?: string;
	action: IContextMenuItemAction;
	method: IContextMenuItemMethod;
	payload: IContextMenuItemPayload;
};

export type IMessageContextMenu = {
	items: IContextMenuItem[];
};

export type IMessageMeta = {
	contextMenu: IMessageContextMenu;
};

export type IMessage = ChannelMessage & {
	id: string;
	content: {
		t?: string;
	};
	date?: string;
	creationTime?: Date;
	creationTimeMs?: number;
	lastSeen?: boolean;
};

export type IMessageWithUser = IMessage & {
	user: IUser | null;
};

export type IMessageSendPayload = {
	t: string;
	contentThread?: string;
};

export type IUser = {
	name: string;
	username: string;
	id: string;
	avatarSm: string;
};

export type IVoice = {
	user_id: string;
	clan_id: string;
	clan_name: string;
	participant: string;
	voice_channel_id: string;
	voice_channel_label: string;
	last_screenshot: string;
};

export interface CategoryNameProps {
	ChannelType: string | undefined;
	channelStatus: string | undefined;
	name: string | undefined;
}

export interface ThreadNameProps {
	name: string | undefined;
}

export interface IconProps {
	url: string;
}

export type ChannelListProps = { className?: string };

export enum ChannelStatus {
	OPEN = 'open',
	CLOSE = 'close',
}

export enum channelStatusEnum {
	LOCK = 'lock',
	UNLOCK = 'unlock',
}

export interface CategoryProps {
	name: string | undefined;
	status?: string;
	type?: string;
}

export interface ThreadProps {
	name: string;
}

export type IUserAccount = ApiAccount;

export type IPermission = ApiPermission;

export enum ChannelStatusEnum {
	isPrivate = 1,
}

export interface ChannelProps {
	name?: string;
	isPrivate?: ChannelStatusEnum;
	categories?: Record<string, CategoryProps>;
	type?: ChannelType;
}

export interface CategoryProps {
	name: string | undefined;
	status?: string;
	type?: string;
}

export interface ThreadProps {
	name: string;
}

export interface IWithError {
	error: string | Error;
}

export enum EmojiPlaces {
	EMOJI_REACTION = 'EMOJI_REACTION',
	EMOJI_REACTION_BOTTOM = 'EMOJI_REACTION_BOTTOM',
	EMOJI_EDITOR = 'EMOJI_EDITOR',
	EMOJI_REACTION_NONE = 'EMOJI_REACTION_NONE',
}

export interface UnreadChannel {
	channelId: string;
	channelLastSentMessageId: string;
	channelLastSeenMesageId: string;
	timestamp: string;
}

export interface ContentNotificationChannel {
	content: any;
}

export interface NotificationContent {
	avatar?: string;
	channel_id: string;
	channel_label: string;
	clan_id?: string;
	code: number;
	content: string;
	create_time: string;
	reactions?: Array<ApiMessageReaction>;
	mentions?: Array<ApiMessageMention>;
	attachments?: Array<ApiMessageAttachment>;
	references?: Array<ApiMessageRef>;
	referenced_message?: ChannelMessage;
	id: string;
	persistent?: boolean;
	sender_id: string;
	update_time?: { seconds: number };
	user_id_one?: string;
	user_id_two?: string;
	username?: string;
}

export enum SubPanelName {
	NONE = 'NONE',
	GIFS = 'GIFS',
	STICKERS = 'STICKER',
	EMOJI = 'EMOJI',
	EMOJI_REACTION_RIGHT = 'EMOJI_REACTION_RIGHT',
	EMOJI_REACTION_BOTTOM = 'EMOJI_REATIONN_BOTTOM',
}

export type IEmoji = {
	category: string;
	emoji: string;
	html?: string;
	name?: string;
	order?: number;
	shortname: string;
	unicode?: string;
};

export type IEmoticons = {
	[key: string]: string;
};

export type INatives = {
	[key: string]: string;
};

export type ICategoryEmoji = {
	id: string;
	emojis: string[];
};

export type IMetaDataEmojis = {
	id?: string;
	aliases: {
		[key: string]: string;
	};
	categories: ICategoryEmoji[];
	emojis: {
		[key: string]: IEmoji;
	};
	emoticons: IEmoticons;
	natives: INatives;
	originalCategories: ICategoryEmoji[];
	sheet: {
		cols: number;
		rows: number;
	};
};

export type EmojiDataOptionals = {
	action?: boolean;
	id: string | undefined;
	emoji: string | undefined;
	senders: SenderInfoOptionals[];
	channel_id?: string;
	message_id?: string;
};

export type SenderInfoOptionals = {
	sender_id?: string;
	count: number | undefined;
	emojiIdList?: string[];
	sender_name?: string;
	avatar?: string;
};

export interface IGifCategory {
	image: string;
	name: string;
	path: string;
	searchterm: string;
}

export interface IGif {
	itemurl: string;
	media_formats: {
		gif: {
			url: string;
		};
	};
}

export type MentionDataProps = {
	id: string | number;
	display?: string;
	avatarUrl?: string;
	name?: string;
};

export type MentionsInputChangeEvent = {
	target: {
		value: string;
	};
};

export type OnChangeHandlerFunc = (event: MentionsInputChangeEvent, newValue: string, newPlainTextValue: string, mentions: any) => void;

export type UserMentionsOpt = {
	user_id: string | undefined;
	username: string | undefined;
};
export enum ETypeMessage {
	CHANNEL = 'CHANNEL',
	THREAD = 'THREAD',
}

export type ThreadError = {
	name: string;
	message: string;
};

export type ThreadValue = {
	nameValueThread: string;
	isPrivate: number;
};

export type ILineMention = {
	nonMatchText: string;
	matchedText: string;
	startIndex: number;
	endIndex: number;
};

export type IMessageLine = {
	mentions: ILineMention[];
};

export interface UsersClanEntity extends IUsersClan {
	id: string; // Primary ID
}

export interface ChannelMembersEntity extends IChannelMember {
	id: string; // Primary ID
	name?: string;
}

export type SortChannel = {
	isSortChannelByCategoryId: boolean;
	categoryId: string | null;
};

export type UpdateClan = {
	bearerToken: string;
	clanId: string;
	creatorId?: string;
	clanName?: string;
	logo?: string;
	banner?: string;
};

export type RemoveChannelUsers = {
	channelId: string;
	ids?: string[];
};
