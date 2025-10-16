import type { ThreadError } from '../types';

export const TIME_COMBINE = 120;
export const TIME_OFFSET = 3;
export const LIMIT_MESSAGE = 50;
export const LIMIT_CLAN_ITEM = 50;
export const SIZE_PAGE_SEARCH = 25;
export const LIMIT_SIZE_UPLOAD_IMG = 1000000;
export const MAX_FILE_NAME_EMOJI = 62;
export const MAX_FILE_ATTACHMENTS = 50; // 50 items

export const DEBOUNCE_TYPING_TIME = 700;
export const TIME_OF_SHOWING_FIRST_POPUP = 1000 * 60 * 5;
export const KEY_KEYBOARD = { BACKSPACE: 8, TAB: 9, ENTER: 13, ESC: 27, UP: 38, DOWN: 40, RIGHT: 39, LEFT: 27 };
export const GROUP_CHAT_MAXIMUM_MEMBERS = 10;
export const EVERYONE_ROLE_ID = '1825450696619593728';
export const EVERYONE_ROLE_TITLE = 'Everyone';
export const TITLE_MENTION_HERE = '@here';
export const RECENT_EMOJI_CATEGORY = 'Recent';
export const DONE_ONBOARDING_STATUS = 3;
export const FOR_15_MINUTES = 15 * 60 * 1000;
export const FOR_10_MINUTES = 10 * 60 * 1000;
export const FOR_1_HOUR = 60 * 60 * 1000;
export const FOR_3_HOURS = 3 * 60 * 60 * 1000;
export const FOR_8_HOURS = 8 * 60 * 60 * 1000;
export const FOR_24_HOURS = 24 * 60 * 60 * 1000;
export const MAX_LENGTH_MESSAGE_BUZZ = 160;
export const ONE_MINUTE = 60000;
export const GUEST_NAME = 'guest';
export const FOR_SALE_CATE = 'forsale';

export const MUTE = 0;
export const ACTIVE = 1;
export const DEFAULT_ID = '0';
export const LIMIT = 50;

export const threadError: ThreadError = {
	name: 'Thread Name is required',
	message: 'Starter Message is required'
};

export const titleMission = ['Send a message in', 'Visit a channel', 'Do anything you want'];

export const MIN_THRESHOLD_CHARS = 8000;

export type ITypeConvert = {
	type: string;
	typeConvert: string;
};

export const typeConverts: ITypeConvert[] = [
	{ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', typeConvert: 'application/msword' },
	{ type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', typeConvert: 'application/vnd.ms-powerpoint' },
	{ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', typeConvert: 'application/vnd.ms-excel' }
];

export const fileTypeVideo = ['video/mp4', 'video/webm', 'video/mpeg', 'video/x-msvideo'];

export const fileTypeImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];

export const failAttachment = {
	filename: 'failAttachment',
	url: '',
	filetype: 'unknown',
	size: 0,
	width: 0,
	height: 0
};

export enum EPermissionId {
	MANAGE_CHANNEL = '1767478132161384448',
	DELETE_MESSAGE = '1767478279956074496',
	VIEW_CHANNEL = '1767478040251600896',
	ADMINISTRATOR = '1767362573037998080',
	MANAGE_THREAD = '1767478279951880192',
	SEND_MESSAGE = '1767478132157190144',
	MANAGE_CLAN = '1767478279951880193'
}

export const ID_MENTION_HERE = '1775731111020111321';

export const EMOJI_GIVE_COFFEE = {
	emoji: ':coffee:',
	emoji_id: '7280417126303261185'
};
export const SYSTEM_NAME = 'System';
export const SYSTEM_SENDER_ID = '0';
export const HEIGHT_PANEL_PROFILE = 520;
export const WIDTH_PANEL_PROFILE = 300;
export const HEIGHT_PANEL_PROFILE_DM = 314;
export const ACTIVITY_PANEL_HEIGHT = 73;
export const WIDTH_CLAN_SIDE_BAR = 72;
export const WIDTH_CHANNEL_LIST_BOX = 272;

export const DEFAULT_ROLE_COLOR = '#99aab5';
export const DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR = '#17ac86';

export const CHANNEL_INPUT_ID = 'editorReactMentionChannel';
export const GENERAL_INPUT_ID = 'editorReactMention';
export const AMOUNT_TOKEN = {
	TEN_TOKENS: 10,
	TEN_THOUSAND_TOKENS: 10000
};

export const TOKEN_TO_AMOUNT = {
	ONE_THOUNSAND: 1000
};

export const ADD_ROLE_CHANNEL_STATUS = 'Add Role Channel';

export const MEZON_MENTIONS_COPY_KEY = 'text/mezon-mentions';
export enum UploadLimitReason {
	SIZE = 'size',
	COUNT = 'count'
}

// SIZE MEMORY
export const MAX_FILE_SIZE_1MB = 1 * 1024 * 1024; // 1MB
export const MAX_FILE_SIZE_8MB = MAX_FILE_SIZE_1MB * 8; // 8MB
export const MAX_FILE_SIZE_10MB = 10 * MAX_FILE_SIZE_1MB; // 10MB
export const MAX_FILE_SIZE_256KB = MAX_FILE_SIZE_1MB / 4; // 256KB
export const MAX_FILE_SIZE_512KB = MAX_FILE_SIZE_1MB / 2; // 512KB
export const MAX_FILE_SIZE = 100 * MAX_FILE_SIZE_1MB; // 100MB
export const IMAGE_MAX_FILE_SIZE = 50 * MAX_FILE_SIZE_1MB; // 50MB

export enum MiniAppEventType {
	PONG = 'PONG',
	PING = 'PING',
	SEND_TOKEN = 'SEND_TOKEN',
	GET_CLAN_ROLES = 'GET_CLAN_ROLES',
	SEND_BOT_ID = 'SEND_BOT_ID',
	GET_CLAN_USERS = 'GET_CLAN_USERS',
	JOIN_ROOM = 'JOIN_ROOM',
	LEAVE_ROOM = 'LEAVE_ROOM',
	CREATE_VOICE_ROOM = 'CREATE_VOICE_ROOM',
	CURRENT_USER_INFO = 'CURRENT_USER_INFO',
	CLAN_ROLES_RESPONSE = 'CLAN_ROLES_RESPONSE',
	USER_HASH_INFO = 'USER_HASH_INFO',
	CLAN_USERS_RESPONSE = 'CLAN_USERS_RESPONSE',
	SEND_TOKEN_RESPONSE_SUCCESS = 'SEND_TOKEN_RESPONSE_SUCCESS',
	SEND_TOKEN_RESPONSE_FAILED = 'SEND_TOKEN_RESPONSE_FAILED',
	GET_CHANNELS = 'GET_CHANNELS',
	CHANNELS_RESPONSE = 'CHANNELS_RESPONSE',
	GET_CLAN = 'GET_CLAN',
	CLAN_RESPONSE = 'CLAN_RESPONSE',
	GET_CHANNEL = 'GET_CHANNEL',
	CHANNEL_RESPONSE = 'CHANNEL_RESPONSE',
	CHECK_MICROPHONE_STATUS = 'CHECK_MICROPHONE_STATUS',
	MICROPHONE_STATUS = 'MICROPHONE_STATUS',
	TOGGLE_MICROPHONE = 'TOGGLE_MICROPHONE'
}

export const CREATING_THREAD = 'CREATING_THREAD';
export const CREATING_TOPIC = 'CREATING_TOPIC';

export const COLLAPSED_SIZE = { width: 430, height: 48 };

export const INIT_SIZE = { width: 430, height: 630 };

export const MIN_POSITION = { x: 0, y: 0 };
export const DEFAULT_POSITION = { x: 100, y: 100 };

export const ASPECT_RATIO = 4 / 3;

export enum EMuteState {
	UN_MUTE = 1,
	MUTED = 0
}

export const STICKER_WAVE = {
	URL: 'https://cdn.mezon.ai/stickers/hello.gif',
	NAME: 'hello'
};

export const MEZON_AVATAR_URL = 'https://cdn.mezon.ai/0/1840653409082937344/1782991817428439000/1748500199026_0logo_new.png';
export const WAVE_SENDER_NAME = 'Mezon';

export const CURRENCY = {
	CODE: 'vi-VN',
	SYMBOL: 'đồng'
};

export const ITEM_TYPE = {
	EMOJI: 0,
	STICKER: 1
};
