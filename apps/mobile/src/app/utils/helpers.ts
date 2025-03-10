import { load, save, STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE } from '@mezon/mobile-components';
import { safeJSONParse } from 'mezon-js';
import { Platform } from 'react-native';

export const sleep = (milliseconds: number) => {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'android';

export const getSnapToOffets = (imageWidth: number, padding: number, width: number, array) => {
	const imageWidthWithPadding = imageWidth + padding;
	const snapToOffsets = array.map((_, id: number) => {
		if (id === 1) {
			return id * (imageWidthWithPadding - ((width - imageWidth) / 2 - padding * 2 + 2));
		} else {
			return id * imageWidthWithPadding - ((width - imageWidth) / 2 - padding * 2 + 2);
		}
	});

	return snapToOffsets;
};
export const isImage = (url?: string) => {
	return /\.(jpg|jpeg|png|webp|avif|gif|svg|heic|PNG)/.test(url);
};

export const isVideo = (url?: string) => {
	return /\.(mp4|webm|mov|mkv)/.test(url);
};

export const isAudio = (url?: string) => {
	return /\.(mp3)$/i.test(url || '');
};

export const normalizeString = (str: string) => {
	if (!str) {
		return '';
	}
	const normalizedStr = str?.replace?.(/\s+/g, '')?.trim();
	return normalizedStr?.toLowerCase?.();
};
export const urlPattern = /((?:https?:\/\/|www\.)[^\s]+|(?<![.])\b[^\s]+\.(?:[a-zA-Z]{2,}|[a-zA-Z]{2}\.[a-zA-Z]{2}))/g;
export const highlightEmojiRegex = /(:\b[^:\s]*\b:)/g;
export const urlRegex = /(https?:\/\/[^\s]+)/g;
export const markdownDefaultUrlRegex = /^\[.*?\]\(https?:\/\/[^\s]+\)$/;
export const emojiRegex = /:[a-zA-Z0-9_]+:/g;
export const channelIdRegex = /<#(\d+)>/;
export const codeBlockRegex = /^```[\s\S]*```$/;
export const codeBlockRegexGlobal = /```[\s\S]*?```/g;
export const splitBlockCodeRegex =
	/(```[\s\S]*?```)|(https?:\/\/[^\s]+)|(<#\d+>)|(@[\w.]+)|(\w+)|(\s+)|(\[.*?\]\(https?:\/\/[^\s]+\))|(:[a-zA-Z0-9_]+:)/g;

export const validURL = (string: string) => {
	const res = string?.match?.(urlPattern);
	return res !== null;
};

export const clanAndChannelIdLinkRegex = /clans\/(\d+)\/channels\/(\d+)/;
export const clanDirectMessageLinkRegex = /chat\/direct\/message\/(\d+)\/(\d+)$/;

export const validTextInputRegex = /^(?![_\-\s])[a-zA-Z0-9\p{L}\p{N}_\-\s]{1,64}$/u;
export const linkGoogleMeet = 'https://meet.google.com/';

export const resetCachedMessageActionNeedToResolve = (channelId: string) => {
	const allCachedMessage = load(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE) || {};
	if (allCachedMessage?.[channelId]) allCachedMessage[channelId] = null;
	save(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE, allCachedMessage);
};

export const getUserStatusByMetadata = (metadata: string | { status: string; user_status: string }) => {
	return typeof metadata === 'string' ? safeJSONParse(metadata)?.user_status : metadata?.user_status;
};
