import { load, save, STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE } from '@mezon/mobile-components';
import { EmojiDataOptionals } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { deflate, inflate } from 'react-native-gzip';

export const sleep = (milliseconds: number) => {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const isImage = (url?: string) => {
	return /\.(jpg|jpeg|png|webp|avif|gif|svg|heic|PNG)/.test(url);
};

export const checkFileTypeImage = (type: string) => type?.startsWith('image/');

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
export const highlightEmojiRegex = /(:[^:]+:)/g;
export const clanAndChannelIdLinkRegex = /clans\/(\d+)\/channels\/(\d+)/;
export const clanDirectMessageLinkRegex = /chat\/direct\/message\/(\d+)\/(\d+)$/;

export const validTextInputRegex = /^(?![_\-\s])[a-zA-Z0-9\p{L}\p{N}_\-\s]{1,64}$/u;
export const linkGoogleMeet = 'https://meet.google.com/';

export const resetCachedMessageActionNeedToResolve = (channelId: string) => {
	try {
		const allCachedMessage = load(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE) || {};
		if (allCachedMessage?.[channelId]) allCachedMessage[channelId] = null;
		save(STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE, allCachedMessage);
	} catch (error) {
		console.error('Failed to reset cached message action need to resolve:', error);
	}
};

export const resetCachedChatbox = (channelId: string) => {
	try {
		const allCachedMessage = load(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES) || {};
		if (allCachedMessage?.[channelId]) allCachedMessage[channelId] = '';
		save(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES, allCachedMessage);
	} catch (error) {
		console.error('Failed to reset cached chatbox:', error);
	}
};

export const getUserStatusByMetadata = (metadata: string | { status: string; user_status: string }) => {
	return typeof metadata === 'string' ? safeJSONParse(metadata)?.user_status : metadata?.user_status;
};

export function combineMessageReactions(reactions: any[], message_id: string): any[] {
	const dataCombined: Record<string, EmojiDataOptionals> = {};

	if (!reactions) return [];

	for (const reaction of reactions) {
		const emojiId = reaction?.emoji_id || ('' as string);
		const emoji = reaction?.emoji || ('' as string);

		if (reaction?.count < 1) {
			continue;
		}

		if (!dataCombined?.[emojiId]) {
			dataCombined[emojiId] = {
				emojiId,
				emoji,
				senders: [],
				action: false,
				message_id: message_id,
				id: '',
				channel_id: ''
			};
		}
		if (!reaction?.sender_name) continue;
		const newSender = {
			sender_id: reaction?.sender_id,
			count: reaction?.count
		};

		const reactionData = dataCombined?.[emojiId];
		const senderIndex = reactionData?.senders?.findIndex((sender) => sender?.sender_id === newSender?.sender_id);

		if (senderIndex === -1) {
			reactionData?.senders?.push(newSender);
		} else if (reactionData?.senders?.[senderIndex]) {
			reactionData.senders[senderIndex].count = newSender?.count;
		}
	}

	const dataCombinedArray = Object.values(dataCombined);

	return dataCombinedArray;
}

export function isEqualStringArrayUnordered(a: string[], b: string[]): boolean {
	try {
		if (a.length !== b.length) return false;
		return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
	} catch (error) {
		console.error('Error comparing string arrays:', error);
		return false;
	}
}

export const getQueryParam = (url: string, key: string): string | null => {
	if (!url) return null;
	const qIndex = url.indexOf('?');
	if (qIndex === -1) return null;
	const hashIndex = url.indexOf('#', qIndex);
	const search = url.slice(qIndex + 1, hashIndex === -1 ? undefined : hashIndex);
	try {
		const params = new URLSearchParams(search);
		return params.get(key);
	} catch {
		return null;
	}
};

export const compress = async (str: string) => {
	return await deflate(str);
};

export const decompress = async (compressedStr: string) => {
	return await inflate(compressedStr);
};
