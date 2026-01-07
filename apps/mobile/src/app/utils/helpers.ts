import {
	load,
	remove,
	save,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES,
	STORAGE_MESSAGE_ACTION_NEED_TO_RESOLVE
} from '@mezon/mobile-components';
import {
	accountActions,
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	getStore,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	notificationActions,
	selectAllAccount
} from '@mezon/store-mobile';
import type { EmojiDataOptionals } from '@mezon/utils';
import { Platform } from 'react-native';
import { deflate, inflate } from 'react-native-gzip';

export const sleep = (milliseconds: number) => {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const isImage = (url?: string) => {
	return /\.(jpg|jpeg|png|webp|avif|gif|svg|heic|PNG)/.test(url);
};

export const checkFileTypeImage = (type: string) => type?.startsWith('image/');
export const checkFileTypeVideo = (type: string) => type?.startsWith('video/');

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
export const validTextInputRegexEmoji = /^(?![_\-\s])(?:(?!')[a-zA-Z0-9\p{L}\p{N}\p{So}_\-\s]){1,64}$/u;
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

export function combineMessageReactions(reactions: any[], messageId: string): any[] {
	const dataCombined: Record<string, EmojiDataOptionals> = {};

	if (!reactions) return [];

	for (const reaction of reactions) {
		const emojiId = reaction?.emojiId || ('' as string);
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
				messageId,
				id: '',
				channelId: ''
			};
		}
		//if (!reaction?.senderName) continue;
		const newSender = {
			senderId: reaction?.senderId,
			count: reaction?.count
		};

		const reactionData = dataCombined?.[emojiId];
		const senderIndex = reactionData?.senders?.findIndex((sender) => sender?.senderId === newSender?.senderId);

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

export const removeDiacritics = (str) => {
	if (!str) return '';
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D');
};

export const maskEmail = (email: string) => {
	if (!email) return '';
	const atIndex = email.indexOf('@');
	return `${'*'.repeat(atIndex)}${email.slice(atIndex)}`;
};

export const maskPhoneNumber = (phone: string) => {
	if (!phone) return '';
	return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
};

export const getEmojiAndStickerId = (url?: string): string => {
	try {
		if (!url) return '';
		const fileName = url.split('/').pop() || '';
		return fileName.replace(/\.[^/.]+$/, '');
	} catch (error) {
		console.error('Failed to get emoji/sticker id:', error);
		return '';
	}
};

export const removeBackticks = (text: string) => {
	let result = '';
	let i = 0;
	while (i < text.length) {
		// 1. Triple Backtick
		if (text.substring(i, i + 3) === '```') {
			let j = i + 3;
			let content = '';
			while (j < text.length && text.substring(j, j + 3) !== '```') {
				content += text[j];
				j++;
			}
			if (j < text.length && text.substring(j, j + 3) === '```') {
				result += content;
				i = j + 3;
				continue;
			}
		}

		// 3. Single Backtick
		if (text[i] === '`' && text.substring(i, i + 3) !== '```') {
			const j = i + 1;
			let markdown = '';
			let tempJ = j;
			while (tempJ < text.length && text[tempJ] !== '`') {
				markdown += text[tempJ];
				tempJ++;
			}
			if (tempJ < text.length && text[tempJ] === '`') {
				const content = markdown;
				let allow = true;
				if (text.substring(tempJ, tempJ + 3) === '```') {
					let k = tempJ + 3;
					let hasClosingTriple = false;
					while (k < text.length - 2) {
						if (text.substring(k, k + 3) === '```') {
							hasClosingTriple = true;
							break;
						}
						k++;
					}
					if (hasClosingTriple) allow = false;
				}

				if (allow && !content.includes('``') && content.trim().length > 0) {
					result += content;
					i = tempJ + 1;
					continue;
				}
			}
		}
		result += text[i];
		i++;
	}
	return result;
};

export const logoutGlobal = async () => {
	const store = getStore();
	const userProfile = selectAllAccount(store.getState());
	store.dispatch(authActions.logOut({ deviceId: userProfile.user.username, platform: Platform.OS }));
	store.dispatch(directActions.removeAll());
	store.dispatch(notificationActions.removeAll());
	store.dispatch(channelsActions.removeAll());
	store.dispatch(messagesActions.removeAll());
	store.dispatch(listChannelsByUserActions.removeAll());
	store.dispatch(clansActions.setCurrentClanId(''));
	store.dispatch(clansActions.removeAll());
	store.dispatch(clansActions.collapseAllGroups());
	store.dispatch(clansActions.clearClanGroups());
	store.dispatch(clansActions.refreshStatus());
	store.dispatch(accountActions.resetAllState());
	store.dispatch(notificationActions.resetAllState());
	store.dispatch(listUsersByUserActions.removeAll());

	await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
	await remove(STORAGE_CHANNEL_CURRENT_CACHE);
	await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
	await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
	store.dispatch(appActions.setIsShowWelcomeMobile(false));
	store.dispatch(appActions.setLoadingMainMobile(false));
};
