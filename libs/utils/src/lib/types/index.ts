import { ChannelDescription, ChannelMessage, ChannelType, HashtagDm, Notification, NotificationType } from 'mezon-js';
import {
	ApiAccount,
	ApiCategoryDesc,
	ApiChannelAttachment,
	ApiChannelDescription,
	ApiChannelMessageHeader,
	ApiClanDesc,
	ApiClanProfile,
	ApiEventManagement,
	ApiInviteUserRes,
	ApiMessageAttachment,
	ApiMessageMention,
	ApiMessageReaction,
	ApiMessageRef,
	ApiNotificationSetting,
	ApiNotificationUserChannel,
	ApiPermission,
	ApiPinMessage,
	ApiRole,
	ApiSearchMessageDocument,
	ApiSystemMessage,
	ApiUser,
	ClanUserListClanUser,
	RoleUserListRoleUser
} from 'mezon-js/api.gen';
import { ApiNotifiReactMessage, ApiNotificationChannelCategorySetting, ApiPermissionRoleChannel } from 'mezon-js/dist/api.gen';
import { MentionItem } from 'react-mentions';
import { IEmojiOnMessage, IHashtagOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage } from './messageLine';

export * from './messageLine';
export * from './mimeTypes';
export * from './permissions';
export * from './thumbnailPos';

export type LoadingStatus = 'not loaded' | 'loading' | 'loaded' | 'error';

export type IClan = ApiClanDesc & {
	id: string;
};

export type IChannelAttachment = ApiChannelAttachment & {
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
	prioritizeName?: string;
	id: string;
};

export type IRolesClan = ApiRole & {
	id: string;
};

export type INotificationSetting = ApiNotificationUserChannel;

export type INotifiReactMessage = ApiNotifiReactMessage;

export type IDefaultNotificationClan = ApiNotificationSetting;

export type IDefaultNotificationCategory = ApiNotificationSetting & {
	active?: number;
	time_mute?: string;
};

export type IDefaultNotification = ApiNotificationSetting & {
	id: string;
};
export type IChannelCategorySetting = ApiNotificationChannelCategorySetting & {
	id: string;
};
export type IHashtagDm = HashtagDm & {
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
	threads?: IChannel[];
};

export type IChannel = ApiChannelDescription & {
	id: string;
	unread?: boolean;
	description?: string;
	usernames?: string;
	isRoleUser?: boolean;
};

export type IPinMessage = ApiPinMessage & {
	id: string;
};

export type IPSystemMessage = ApiSystemMessage & {
	id: string;
};

export type IChannelMember = ClanUserListClanUser & {
	id: string;
	channelId?: string;
	userChannelId?: string;
	user_id?: string; // use on VoiceChannelList
	participant?: string; // use on VoiceChannelList
};

export type IThread = {
	id?: string | undefined;
	/// new update
	clan_id?: string | undefined;
	parrent_id?: string | undefined;
	channel_id?: string | undefined;
	category_id?: string | undefined;
	type?: number;
	creator_id?: string | undefined;
	channel_label?: string | undefined;
	active?: number;
	create_time_seconds?: number | string | undefined;
	update_time_seconds?: number | string | undefined;
	last_sent_message?: ApiChannelMessageHeader;
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
	content: IMessageSendPayload;
	date?: string;
	creationTime?: Date;
	lastSeen?: boolean;
	isSending?: boolean;
	isError?: boolean;
	isMe?: boolean;
	isAnonymous?: boolean;
	isCurrentChannel?: boolean;
	isFirst?: boolean;
	hide_editted?: boolean;
	isErrorRetry?: boolean;
	code?: number;
};

export type SearchMessage = ApiSearchMessageDocument & {
	id: string;
};

export type IMessageWithUser = IMessage & {
	isStartedMessageGroup?: boolean;
	isStartedMessageOfTheDay?: boolean;
	user: IUser | null;
};

export interface IEmbedProps {
	color?: string;
	title?: string;
	url?: string;
	author?: {
		name: string;
		icon_url?: string;
		url?: string;
	};
	description?: string;
	thumbnail?: { url: string };
	fields?: Array<{ name: string; value: string; inline?: boolean }>;
	image?: { url: string };
	timestamp?: string;
	footer?: { text: string; icon_url?: string };
}

export interface IMessageSendPayload {
	t?: string;
	hg?: IHashtagOnMessage[];
	ej?: IEmojiOnMessage[];
	lk?: ILinkOnMessage[];
	mk?: IMarkdownOnMessage[];
	vk?: ILinkVoiceRoomOnMessage[];
	embed?: IEmbedProps;
}

export type IUser = {
	name: string;
	username: string;
	id: string;
};

export type MetaDateStatusUser = {
	status: string;
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

export type IUserStream = {
	user_id: string;
	clan_id: string;
	clan_name: string;
	participant: string;
	streaming_channel_id: string;
	streaming_channel_label: string;
};

export type IChannelsStream = {
	channel_id: string;
	clan_id: string;
	is_streaming: boolean;
	streaming_url: string;
};

export type IStreamInfo = {
	clanId: string;
	clanName: string;
	streamId: string;
	streamName: string;
	parentId: string;
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
	CLOSE = 'close'
}

export enum channelStatusEnum {
	LOCK = 'lock',
	UNLOCK = 'unlock'
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
	isPrivate = 1
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
	EMOJI_REACTION_NONE = 'EMOJI_REACTION_NONE'
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
	clan_logo?: string;
	category_name?: string;
	username?: string;
}

export enum SubPanelName {
	NONE = 'NONE',
	GIFS = 'GIFS',
	STICKERS = 'STICKER',
	EMOJI = 'EMOJI',
	EMOJI_REACTION_RIGHT = 'EMOJI_REACTION_RIGHT',
	EMOJI_REACTION_BOTTOM = 'EMOJI_REATIONN_BOTTOM'
}

export enum MemberProfileType {
	MEMBER_LIST = 'member_list',
	FOOTER_PROFILE = 'footer_profile',
	DM_LIST = 'dm_list_friends',
	DM_MEMBER_GROUP = 'dm_member_group',
	LIST_FRIENDS = 'list_friends',
	MESSAGE = 'message'
}

export type IReaction = ApiMessageReaction & {
	id: string;
	message_id: string;
};

export type IEmoji = {
	category?: string;
	creator_id?: string;
	id?: string;
	shortname?: string;
	src?: string;
	logo?: string;
	clan_name?: string;
	clan_id?: string;
};

export type IChannelUser = ChannelDescription & {
	id: string;
	active?: number;
};

export type IUsers = ApiUser & {
	id: string;
};

export type IPermissionRoleChannel = ApiPermissionRoleChannel & {
	id: string;
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
	emojiId: string | undefined;
	emoji: string | undefined;
	senders: SenderInfoOptionals[];
	channel_id?: string;
	message_id?: string;
};

export type SenderInfoOptionals = {
	sender_id?: string;
	count: number | undefined;
};

export type ChannelDraftMessages = {
	message_id: string;
	draftContent: IMessageSendPayload;
	draftMention: ApiMessageMention[];
	draftAttachment: ApiMessageAttachment[];
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
		tinygif: {
			url: string;
		};
	};
}

export type MentionDataProps = {
	id: string | number;
	display?: string | undefined;
	avatarUrl?: string | undefined;
	displayName?: string | undefined;
	clanNick?: string | undefined;
	clanAvatar?: string | undefined;
	user?: ApiUser;
	username?: string | undefined;
	isRoleUser?: boolean;
};

export type UserSearchDataProps = {
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
	user_id?: string | undefined;
	username?: string | undefined;
	role_id?: string | undefined;
	rolename?: string | undefined;
};

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
	isOnlyEmoji: boolean;
	links: ILineMention[];
};

export interface UsersClanEntity extends IUsersClan {
	id: string; // Primary ID
}

export interface ChannelMembersEntity extends IChannelMember {
	id: string; // Primary ID
	name?: string;
	clanNick?: string;
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

export type RemoveClanUsers = {
	clanId: string;
	channelId: string;
	userIds: string[];
};

export type RemoveChannelUsers = {
	channelId: string;
	userIds: string[];
};

export enum Tabs_Option {
	LOCATION = 0,
	EVENT_INFO = 1,
	REVIEW = 2
}

export enum OptionEvent {
	OPTION_SPEAKER = 'Speaker',
	OPTION_LOCATION = 'Location'
}

export enum MentionTypeEnum {
	MENTION = 'MENTION',
	HASHTAG = 'HASHTAG',
	EMOJI_SYNTAX = 'EMOJI_SYNTAX'
}

export type ContenSubmitEventProps = {
	topic: string;
	titleEvent: string;
	timeStart: string;
	timeEnd: string;
	selectedDateStart: Date;
	selectedDateEnd: Date;
	voiceChannel: string;
	logo: string;
	description: string;
};

export enum SHOW_POSITION {
	IN_VIEWER = 'IN_VIEWER',
	IN_LINK = 'IN_LINK',
	IN_EMOJI = 'IN_EMOJI',
	IN_STICKER = 'IN_STICKER',
	NONE = 'NONE'
}

export type EmojiStorage = {
	emojiId: string;
	emoji: string;
	messageId: string;
	senderId: string;
	action: boolean;
	channel_id?: string;
};

export enum Direction_Mode {
	AFTER_TIMESTAMP = 1,
	AROUND_TIMESTAMP = 2,
	BEFORE_TIMESTAMP = 3
}

export enum MouseButton {
	LEFT = 0,
	MIDDLE = 1,
	RIGHT = 2
}

export enum NotificationCode {
	DM_REQUEST = -1,
	FRIEND_REQUEST = -2,
	FRIEND_ACCEPT = -3,
	GROUP_ADD = -4,
	GROUP_JOIN_REQUEST = -5,
	FRIEND_JOIN_GAME = -6,
	SINGLE_SOCKET = -7,
	USER_BANNED = -8,
	USER_MENTIONED = -9,
	USER_REACTIONED = -10,
	USER_REPLIED = -11
}

export enum ChannelIsNotThread {
	TRUE = '0'
}

export enum RoleEveryOne {
	TRUE = '0'
}

export enum EMessageCode {
	FIRST_MESSAGE = 4
}

export enum ModeResponsive {
	MODE_CLAN = 'clan',
	MODE_DM = 'dm'
}

export type ApiChannelMessageHeaderWithChannel = ApiChannelMessageHeader & {
	channel_id: string;
};

export enum ThemeApp {
	Light = 'light',
	Dark = 'dark',
	System = 'system'
}

export interface INotification extends Notification {
	id: string;
	content?: any;
}
export interface NotificationEntity extends INotification {
	id: string;
}

export type TNotificationChannel = {
	channel_id?: string;
	clan_logo?: string;
	channel_label?: string;
	clan_id?: string;
	clan_name?: string;
	category_name?: string;
	notifications: NotificationEntity[];
};

export enum SlugPermission {
	Admin = 'administrator'
}

export enum TypeSearch {
	Dm_Type = 1,
	Channel_Type = 2
}

export type SearchItemProps = {
	typeChat?: number;
	displayName?: string;
	id?: string;
	name?: string;
	avatarUser?: string;
	lastSentTimeStamp?: any;
	idDM?: string;
	type?: number;
	clanAvatar?: string;
	clanNick?: string;
	prioritizeName?: string;
	subText?: string;
	icon?: string;
	channelId?: string;
	channel_private?: number;
	parrent_id?: string;
	clanId?: string;
	meeting_code?: string;
};

export enum EEmojiCategory {
	CUSTOM = 'Custom'
}

export enum ActiveDm {
	OPEN_DM = 1
}

export enum ETypeMEntion {
	MENTION = 0,
	HASHTAG = 1,
	EMOJI = 2
}

export interface IRoleMention {
	roleId: string;
	roleName: string;
}

export enum ETokenMessage {
	MENTIONS = 'mentions',
	EMOJIS = 'ej',
	HASHTAGS = 'hg',
	LINKS = 'lk',
	VOICE_LINKS = 'vk',
	MARKDOWNS = 'mk'
}
export type SearchFilter = {
	field_name: string;
	field_value?: string;
};

export enum ETypeLinkMedia {
	IMAGE_PREFIX = 'image',
	VIDEO_PREFIX = 'video'
}

export type RequestInput = {
	valueTextInput: string;
	content: string;
	mentionRaw: MentionItem[];
};

export enum EUserSettings {
	ACCOUNT = 'Account',
	PROFILES = 'Profiles',
	PRIVACY_SAFETY = 'Privacy & Safety',
	FAMILY_CENTER = 'Family Center',
	AUTHORIZED_APPS = 'Authorized Apps',
	DEVICES = 'Devices',
	CONNECTIONS = 'Connections',
	CLIPS = 'Clips',
	FRIEND_REQUESTS = 'Friend Requests',
	APP_SETTINGS = 'APP SETTINGS',
	APPEARANCE = 'Appearance',
	ACCESSIBILITY = 'Accessibility',
	VOICE_VIDEO = 'Voice & Video',
	TEXT_IMAGE = 'Text & Image',
	NOTIFICATIONS = 'Notifications',
	KEYBINDS = 'Keybinds',
	LANGUAGE = 'Language',
	STREAMER_MODE = 'Streamer Mode',
	ADVANCED = 'Advanced',
	LOG_OUT = 'Log Out'
}

export enum ENotificationTypes {
	DEFAULT = 0,
	ALL_MESSAGE = NotificationType.ALL_MESSAGE,
	MENTION_MESSAGE = NotificationType.MENTION_MESSAGE,
	NOTHING_MESSAGE = NotificationType.NOTHING_MESSAGE
}

export type PreSendAttachment = {
	channelId?: string;
	mode?: string;
	clan_id?: string;
	files: ApiMessageAttachment[];
};

export type UploadingAttachmentStatus = {
	channelId?: string;
	messageId?: string;
	statusUpload?: EUploadingStatus;
	count?: number;
};

export enum EUploadingStatus {
	LOADING = 'loading',
	SUCCESSFULLY = 'successfully',
	ERROR = 'error'
}

export enum EFailAttachment {
	FAIL_ATTACHMENT = 'failAttachment'
}

export enum EEventStatus {
	UPCOMING = 'UPCOMING',
	ONGOING = 'ONGOING',
	COMPLETED = 'COMPLETED',
	UNKNOWN = 'UNKNOWN'
}

export enum TypeCheck {
	TYPECLAN = 0,
	TYPECATEGORY = 1,
	TYPECHANNEL = 2,
	TYPETHREAD = 3,
	TYPENICKNAME = 4
}

export enum ThreadStatus {
	activePublic = 2,
	joined = 1
}

export type ICanvas = {
	id?: string;
	clan_id: string;
	channel_id: string;
	title?: string;
	content?: string;
	is_default?: boolean;
	creator_id?: string;
};

export type CanvasUpdate = {
	content: string;
	creator_id: string;
	editor_id: string;
	id: string;
	title: string;
};

export type IActivity = {
	activity_description?: string;
	activity_name?: string;
	activity_type?: number;
	application_id?: string;
	end_time?: string;
	start_time?: string;
	status?: number;
	user_id?: string;
	id: string;
};

export interface ActivitiesInfo {
	appName: string;
	windowTitle: string;
	startTime: string;
}

export enum ActivitiesType {
	VISUAL_STUDIO_CODE = 1,
	SPOTIFY = 2,
	LOL = 3
}

export enum ActivitiesName {
	CODE = 'Code',
	SPOTIFY = 'Spotify',
	LOL = 'LeagueClientUx'
}

export enum TypeMessage {
	Chat = 0,
	ChatUpdate = 1,
	ChatRemove = 2,
	Typing = 3,
	Indicator = 4,
	Welcome = 5,
	CreateThread = 6,
	CreatePin = 7
}

export enum ServerSettingsMenuValue {
	Overview = 0,
	Roles = 1,
	Emoji = 2,
	Stickers = 3,
	Soundboard = 4,
	Widget = 5,
	ServerTemplate = 6,
	CustomInviteLink = 7,
	Integrations = 8,
	AppDirectory = 9,
	SafetySetup = 10,
	AutoMod = 11,
	AuditLog = 12,
	Bans = 13,
	CommunitySettings = 14,
	ServerSubscriptions = 15,
	ServerBoostStatus = 16,
	Members = 17,
	Invites = 18
}

export const serverSettingsMenuList = [
	{
		label: 'Overview',
		value: ServerSettingsMenuValue.Overview
	},
	{
		label: 'Roles',
		value: ServerSettingsMenuValue.Roles
	},
	{
		label: 'Emoji',
		value: ServerSettingsMenuValue.Emoji
	},
	{
		label: 'Stickers',
		value: ServerSettingsMenuValue.Stickers
	},
	{
		label: 'Soundboard',
		value: ServerSettingsMenuValue.Soundboard
	},
	{
		label: 'Widget',
		value: ServerSettingsMenuValue.Widget
	},
	{
		label: 'Server Template',
		value: ServerSettingsMenuValue.ServerTemplate
	},
	{
		label: 'Custom Invite Link',
		value: ServerSettingsMenuValue.CustomInviteLink
	},
	{
		label: 'Integrations',
		value: ServerSettingsMenuValue.Integrations
	},
	{
		label: 'App Directory',
		value: ServerSettingsMenuValue.AppDirectory
	},
	{
		label: 'Safety Setup',
		value: ServerSettingsMenuValue.SafetySetup
	},
	{
		label: 'AutoMod',
		value: ServerSettingsMenuValue.AutoMod
	},
	{
		label: 'Audit Log',
		value: ServerSettingsMenuValue.AuditLog
	},
	{
		label: 'Bans',
		value: ServerSettingsMenuValue.Bans
	},
	{
		label: 'Community Settings',
		value: ServerSettingsMenuValue.CommunitySettings
	},
	{
		label: 'Server Subscriptions',
		value: ServerSettingsMenuValue.ServerSubscriptions
	},
	{
		label: 'Server Boost Status',
		value: ServerSettingsMenuValue.ServerBoostStatus
	},
	{
		label: 'Members',
		value: ServerSettingsMenuValue.Members
	},
	{
		label: 'Invites',
		value: ServerSettingsMenuValue.Invites
	}
];
