import {
	ChannelDescription,
	ChannelMessage,
	ChannelStreamMode,
	ChannelType,
	HashtagDm,
	JoinPTTChannel,
	Notification,
	NotificationType,
	TalkPTTChannel,
	WebrtcSignalingFwd
} from 'mezon-js';
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
import { HTMLInputTypeAttribute } from 'react';
import { MentionItem } from 'react-mentions';
import { ILongPressType } from '../hooks';
import { CanvasDataResponse } from './htmlCanvas';
import { IEmojiOnMessage, IHashtagOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage } from './messageLine';

export * from './base';
export * from './config';
export * from './htmlCanvas';
export * from './messageLine';
export * from './mimeTypes';
export * from './permissions';
export * from './style';
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
	fields?: IFieldEmbed[];
	image?: { url: string };
	timestamp?: string;
	footer?: { text: string; icon_url?: string };
}

export interface IFieldEmbed {
	name: string;
	value: string;
	inline?: boolean;
	inputs?: SelectComponent | InputComponent | DatePickerComponent | RadioComponent;
	button?: ButtonComponent[];
}

export enum EButtonMessageStyle {
	PRIMARY = 1,
	SECONDARY = 2,
	SUCCESS = 3,
	DANGER = 4,
	LINK = 5
}

export enum EMessageComponentType {
	BUTTON = 1,
	SELECT = 2,
	INPUT = 3,
	DATEPICKER = 4,
	RADIO = 5
}

export enum EIconEmbedButtonMessage {
	PLAY = 'PLAY',
	PAUSE = 'PAUSE'
}
export interface IButtonMessage {
	label: string;
	disable?: boolean;
	style?: EButtonMessageStyle;
	url?: string;
	icon?: EIconEmbedButtonMessage;
}

export interface IMessageSelectOption {
	label: string;
	value: string;
	description?: string;
	default?: boolean;
}
export interface IMessageRatioOption {
	label: string;
	description?: string;
	name?: string;
	value: string;
	style?: EButtonMessageStyle;
}

export interface IMessageInput {
	placeholder?: string;
	type?: HTMLInputTypeAttribute;
	required?: boolean;
	textarea?: boolean;
	style?: EButtonMessageStyle;
	defaultValue?: string;
}

export interface IMessageDatePicker {
	value: string | Date;
}

export enum IMessageTypeCallLog {
	STARTCALL = 1,
	TIMEOUTCALL = 2,
	FINISHCALL = 3,
	REJECTCALL = 4,
	CANCELCALL = 5
}

export interface IMessageCallLog {
	isVideo: boolean;
	callLogType: IMessageTypeCallLog;
}

export enum EMessageSelectType {
	TEXT = 1,
	USER = 2,
	ROLE = 3,
	CHANNEL = 4
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IMessageSelect {
	// some select specific properties
	type: EMessageSelectType;
	options: IMessageSelectOption[];
	placeholder?: string;
	// Minimum number of items that must be chosen (defaults to 1)
	min_options?: number;
	// Maximum number of items that can be chosen (defaults to 1)
	max_options?: number;
	disabled?: boolean;
	valueSelected?: IMessageSelectOption;
}

export interface IMessageComponent<T> {
	type: EMessageComponentType;
	id: string;
	component: T;
}

export type ButtonComponent = IMessageComponent<IButtonMessage> & { type: EMessageComponentType.BUTTON };
export type SelectComponent = IMessageComponent<IMessageSelect> & { type: EMessageComponentType.SELECT };
export type InputComponent = IMessageComponent<IMessageInput> & { type: EMessageComponentType.INPUT };
export type DatePickerComponent = IMessageComponent<IMessageDatePicker> & { type: EMessageComponentType.DATEPICKER };
export type RadioComponent = IMessageComponent<IMessageRatioOption[]> & { type: EMessageComponentType.RADIO };

export interface IMessageActionRow {
	components: Array<ButtonComponent | SelectComponent | InputComponent>;
}

export interface IMessageSendPayload {
	t?: string;
	e2ee?: number;
	hg?: IHashtagOnMessage[];
	ej?: IEmojiOnMessage[];
	lk?: ILinkOnMessage[];
	mk?: IMarkdownOnMessage[];
	vk?: ILinkVoiceRoomOnMessage[];
	embed?: IEmbedProps[];
	canvas?: CanvasDataResponse;
	components?: IMessageActionRow[];
	callLog?: IMessageCallLog;
	tp?: string;
	cid?: string;
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

export type IDMCall = {
	callerId: string;
	calleeId: string;
	signalingData: WebrtcSignalingFwd;
};

export type IJoinPtt = {
	joinPttData: JoinPTTChannel;
};

export type ITalkPtt = {
	talkPttData: TalkPTTChannel;
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
	MESSAGE = 'message',
	LIST_ACTIVITY = 'list_activity'
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
	count_mess_unread?: number;
	last_seen_message?: any;
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
	color?: string | undefined;
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
	timeStart: string;
	timeEnd: string;
	selectedDateStart: Date;
	selectedDateEnd: Date;
	voiceChannel: string;
	logo: string;
	description: string;
	textChannelId?: string;
	address?: string;
	repeatType?: number | undefined;
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
	USER_REPLIED = -11,
	NOTIFICATION_CLAN = -12,
	NOTIFICATION_TOPIC = -13
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
	lastSeenTimeStamp?: any;
	count_messsage_unread?: number;
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

export type BuzzArgs = {
	isReset?: boolean;
	senderId?: string;
	timestamp?: number;
};

export type AnswerByClanArgs = {
	clanIdQuestionIdAndIndex?: string;
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
	CREATED = 0,
	UPCOMING = 1,
	ONGOING = 2,
	COMPLETED = 3
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
	VISUAL_STUDIO_CODE = 'Visual Studio Code',
	SPOTIFY = 'Spotify',
	LOL = 'LeagueClientUx',
	LOL_MACOS = 'League Of Legends',
	CURSOR = 'Cursor'
}

export enum TypeMessage {
	Chat = 0,
	ChatUpdate = 1,
	ChatRemove = 2,
	Typing = 3,
	Indicator = 4,
	Welcome = 5,
	CreateThread = 6,
	CreatePin = 7,
	MessageBuzz = 8,
	Topic = 9,
	AuditLog = 10
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

export enum ActionLog {
	ALL_ACTION_AUDIT = 'All Actions',
	UPDATE_CLAN_ACTION_AUDIT = 'Update Clan',
	CREATE_CHANNEL_ACTION_AUDIT = 'Create Channel',
	UPDATE_CHANNEL_ACTION_AUDIT = 'Update Channel',
	UPDATE_CHANNEL_PRIVATE_ACTION_AUDIT = 'Update Channel private',
	DELETE_CHANNE_ACTION_AUDIT = 'Delete Channel',
	CREATE_CHANNEL_PERMISSION_ACTION_AUDIT = 'Create Channel Permission',
	UPDATE_CHANNEL_PERMISSION_ACTION_AUDIT = 'Update Channel Permission',
	DELETE_CHANNEL_PERMISSION_ACTION_AUDIT = 'Delete Channel Permission',
	KICK_MEMBER_ACTION_AUDIT = 'Kick Member',
	PRUNE_MEMBER_ACTION_AUDIT = 'Prune Member',
	BAN_MEMBER_ACTION_AUDIT = 'Ban Member',
	UNBAN_MEMBER_ACTION_AUDIT = 'Unban Member',
	UPDATE_MEMBER_ACTION_AUDIT = 'Update Member',
	UPDATE_ROLES_MEMBER_ACTION_AUDIT = 'Update Roles Member',
	MOVE_MEMBER_ACTION_AUDIT = 'Move Member',
	DISCONNECT_MEMBER_ACTION_AUDIT = 'Disconnect Member',
	ADD_BOT_ACTION_AUDIT = 'Add Bot',
	CREATE_THREAD_ACTION_AUDIT = 'Create Thread',
	UPDATE_THREAD_ACTION_AUDIT = 'Update Thread',
	DELETE_THREAD_ACTION_AUDIT = 'Delete Thread',
	CREATE_ROLE_ACTION_AUDIT = 'Create Role',
	UPDATE_ROLE_ACTION_AUDIT = 'Update Role',
	DELETE_ROLE_ACTION_AUDIT = 'Delete Role',
	CREATE_WEBHOOK_ACTION_AUDIT = 'Create Webhook',
	UPDATE_WEBHOOK_ACTION_AUDIT = 'Update Webhook',
	DELETE_WEBHOOK_ACTION_AUDIT = 'Delete Webhook',
	CREATE_EMOJI_ACTION_AUDIT = 'Create Emoji',
	UPDATE_EMOJI_ACTION_AUDIT = 'Update Emoji',
	DELETE_EMOJI_ACTION_AUDIT = 'Delete Emoji',
	CREATE_STICKER_ACTION_AUDIT = 'Create Sticker',
	UPDATE_STICKER_ACTION_AUDIT = 'Update Sticker',
	DELETE_STICKER_ACTION_AUDIT = 'Delete Sticker',
	CREATE_EVENT_ACTION_AUDIT = 'Create Event',
	UPDATE_EVENT_ACTION_AUDIT = 'Update Event',
	DELETE_EVENT_ACTION_AUDIT = 'Delete Event',
	CREATE_CANVAS_ACTION_AUDIT = 'Create Canvas',
	UPDATE_CANVAS_ACTION_AUDIT = 'Update Canvas',
	DELETE_CANVAS_ACTION_AUDIT = 'Delete Canvas',
	CREATE_CATEGORY_ACTION_AUDIT = 'Create Category',
	UPDATE_CATEGORY_ACTION_AUDIT = 'Update Category',
	DELETE_CATEGORY_ACTION_AUDIT = 'Delete Category',
	ADD_MEMBER_CHANNEL_ACTION_AUDIT = 'Add Member Channel',
	REMOVE_MEMBER_CHANNEL_ACTION_AUDIT = 'Remove Member Channel',
	ADD_ROLE_CHANNEL_ACTION_AUDIT = 'Add Role Channel',
	REMOVE_ROLE_CHANNEL_ACTION_AUDIT = 'Remove Role Channel',
	ADD_MEMBER_THREAD_ACTION_AUDIT = 'Add Member Thread',
	REMOVE_MEMBER_THREAD_ACTION_AUDIT = 'Remove Member Thread',
	ADD_ROLE_THREAD_ACTION_AUDIT = 'Add Role Thread',
	REMOVE_ROLE_THREAD_ACTION_AUDIT = 'Remove Role Thread'
}

export enum UserAuditLog {
	ALL_USER_AUDIT = 'All Users'
}

export type IUserAuditLog = {
	userId: string;
	userName: string;
};

export type IUserProfileActivity = {
	avatar_url?: string;
	display_name?: string;
	id?: string;
	username?: string;
	online?: boolean;
	metadata?: { status?: string; user_status?: string };
};

export type IUserItemActivity = {
	id: string;
	user?: IUserProfileActivity;
};

export type UserStatus = {
	user_id: string;
	status: string;
};

export type UserStatusUpdate = {
	status: string;
	minutes?: number;
	until_turn_on: boolean;
};

export enum EUserStatus {
	ONLINE = 'Online',
	IDLE = 'Idle',
	DO_NOT_DISTURB = 'Do Not Disturb',
	INVISIBLE = 'Invisible'
}

export type IDmCallInfo = {
	groupId?: string;
	isVideo?: boolean;
};

export type ImageWindowProps = {
	attachmentData: ApiMessageAttachment & { create_time?: string };
	messageId: string;
	mode: ChannelStreamMode;
	attachmentUrl: string;
	currentClanId: string;
	currentChannelId: string;
	currentDmId: string;
	checkListAttachment: boolean;
};

export enum ESummaryInfo {
	CALL = 'Call',
	STREAM = 'Stream'
}

export type MentionReactInputProps = {
	readonly onSend: (
		content: IMessageSendPayload,
		mentions?: Array<ApiMessageMention>,
		attachments?: Array<ApiMessageAttachment>,
		references?: Array<ApiMessageRef>,
		value?: ThreadValue,
		anonymousMessage?: boolean,
		mentionEveryone?: boolean,
		displayName?: string,
		clanNick?: string
	) => void;
	readonly onTyping?: () => void;
	readonly listMentions?: MentionDataProps[] | undefined;
	readonly isThread?: boolean;
	readonly isTopic?: boolean;
	readonly handlePaste?: (event: React.ClipboardEvent<any>) => Promise<void>;
	readonly handleConvertToFile?: (valueContent: string) => Promise<void>;
	readonly currentClanId?: string;
	readonly currentChannelId?: string;
	readonly mode?: number;
	hasPermissionEdit?: boolean;
	voiceLongPress?: ILongPressType;
	isRecording?: boolean;
};

export type IOtherCall = {
	caller_id?: string;
	channel_id?: string;
};

export type IPermissonMedia = 'granted' | 'denied' | 'not_found';

export enum AttachmentTypeUpload {
	BLOB = 'blob:'
}

export enum CallLog {
	MISSED = 'You Missed',
	RECIPIENT_DECLINED = 'Receiver Rejected',
	YOU_DECLINED = 'You Rejected',
	VOICE_CALL = 'Audio call',
	VIDEO_CALL = 'Video call',
	CALL_BACK = 'Call back',
	INCOMING_CALL = 'Incoming call',
	OUTGOING_CALL = 'Outgoing call',
	YOU_CANCELED = 'You canceled',
	TIME_DEFAULT = '0 mins 0 secs'
}

export interface IAttachmentEntity extends ApiChannelAttachment {
	id: string;
	channelId?: string;
	clanId?: string;
}

export interface IAttachmentEntityWithUploader extends IAttachmentEntity {
	uploaderData: {
		avatar: string;
		name: string;
	};
	realUrl: string;
}

export interface IImageWindowProps {
	channelLabel: string;
	selectedImageIndex: number;
	images: Array<IAttachmentEntityWithUploader>;
}

export interface UsersClanEntity extends IUsersClan {
	id: string; // Primary ID
}

export enum EEventAction {
	CREATED = 1,
	UPDATE = 2,
	DELETE = 3
}

export enum ERepeatType {
	DEFAULT = 0, // is not select
	DOES_NOT_REPEAT = 1,
	WEEKLY_ON_DAY = 2,
	EVERY_OTHER_DAY = 3,
	MONTHLY = 4,
	ANNUALLY = 5,
	EVERY_WEEKDAY = 6
}
