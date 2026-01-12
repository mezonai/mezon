import type { IMessageSendPayload } from '.';

export interface IStartEndIndex {
	s?: number | undefined;
	e?: number | undefined;
}

export enum EBacktickType {
	TRIPLE = 't',
	SINGLE = 's',
	PRE = 'pre',
	CODE = 'c',
	BOLD = 'b',
	LINK = 'lk',
	VOICE_LINK = 'vk',
	LINKYOUTUBE = 'lk_yt'
}

export interface IMention {
	user_id?: string | undefined;
	role_id?: string | undefined;
	username?: string | undefined;
	display?: string;
}

export interface IHashtag {
	channelid: string | undefined;
}
export interface IEmoji {
	emojiid: string | undefined;
}

export interface IMarkdown {
	type?: EBacktickType;
}
export interface IMarkdown {
	type?: EBacktickType;
}
export interface INewPos {
	ne?: number;
	ns?: number;
	markerNumber?: number;
	value?: string;
	accumulatedMarkerTotal?: number;
}
export interface IPre {
	l?: string; // language
}

export interface IBold {
	l?: string; // language
}

export interface IMentionOnMessage extends IMention, IStartEndIndex {}
export interface IExtendedMessage extends IMessageSendPayload {
	mentions?: IMentionOnMessage[];
}
export interface IHashtagOnMessage extends IHashtag, IStartEndIndex {}
export interface IEmojiOnMessage extends IEmoji, IStartEndIndex {}
export type ILinkOnMessage = IStartEndIndex;
export interface IMarkdownOnMessage extends IMarkdown, IStartEndIndex {}
export type ILinkVoiceRoomOnMessage = IStartEndIndex;
export type ILinkYoutubeOnMessage = IStartEndIndex;

export interface IPreMessage extends IPre, IStartEndIndex {}

export interface IBoldMessage extends IBold, IStartEndIndex {}

export interface INewPosMarkdown extends IMarkdown, IStartEndIndex, INewPos {}
