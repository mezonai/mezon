import { ThreadError } from '../types';

export const TIME_COMBINE = 120;
export const TIME_OFFSET = 3;
export const LIMIT_MESSAGE = 50;
export const LIMIT_CLAN_ITEM = 50;
export const SIZE_PAGE_SEARCH = 25;
export const LIMIT_SIZE_UPLOAD_IMG = 1000000;
export const MAX_FILE_NAME_EMOJI = 62;
export const MAX_FILE_ATTACHMENTS = 100;
export const DEBOUNCE_TYPING_TIME = 700;
export const TIME_OF_SHOWING_FIRST_POPUP = 1000 * 60 * 5;
export const KEY_KEYBOARD = { BACKSPACE: 8, TAB: 9, ENTER: 13, ESC: 27, UP: 38, DOWN: 40, RIGHT: 39, LEFT: 27 };
export const GROUP_CHAT_MAXIMUM_MEMBERS = 10;
export const EVERYONE_ROLE_ID = '1825450696619593728';
export const EVERYONE_ROLE_TITLE = 'Everyone';
export const TITLE_MENTION_HERE = '@here';
export const DONE_ONBOARDING_STATUS = 3;
export const FOR_15_MINUTES = 15 * 60 * 1000;
export const FOR_10_MINUTES = 10 * 60 * 1000;
export const FOR_1_HOUR = 60 * 60 * 1000;
export const FOR_3_HOURS = 3 * 60 * 60 * 1000;
export const FOR_8_HOURS = 8 * 60 * 60 * 1000;
export const FOR_24_HOURS = 24 * 60 * 60 * 1000;

export const MUTE = 0;
export const ACTIVE = 1;
export const DEFAULT_ID = '0';

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
export const HEIGHT_PANEL_PROFILE = 480;
export const WIDTH_PANEL_PROFILE = 300;
export const HEIGHT_PANEL_PROFILE_DM = 314;
export const WIDTH_CLAN_SIDE_BAR = 72;
export const WIDTH_CHANNEL_LIST_BOX = 272;

export const DEFAULT_ROLE_COLOR = '#99aab5';
export const DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR = '#17ac86';

export const CHANNEL_INPUT_ID = 'editorReactMentionChannel';
export const GENERAL_INPUT_ID = 'editorReactMention';
export const AMOUNT_TOKEN = {
	TEN_TOKENS: 10
};

export const TOKEN_TO_AMOUNT = {
	ONE_THOUNSAND: 1000
};

export const ADD_ROLE_CHANNEL_STATUS = 'Add Role Channel';
