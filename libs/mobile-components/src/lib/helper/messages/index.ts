import type { ChannelsEntity } from '@mezon/store-mobile';
import type { IMessageSendPayload } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/types';
import { STORAGE_KEY_TEMPORARY_ATTACHMENT } from '../../constant';
import { load, save } from '../storage';

export function abbreviateText(filename: string) {
	const parts = filename.split('.');
	const extension = parts.pop();
	let baseName = parts.join('.');

	const baseNameParts = baseName.split(/[_\s]+/);

	if (baseNameParts.length > 2) {
		baseName = `${baseNameParts[0]}...${baseNameParts[baseNameParts.length - 1]}`;
	} else if (baseNameParts.length === 2) {
		baseName = `${baseNameParts[0]}...${baseNameParts[1]}`;
	}

	return `${baseName}.${extension}`;
}

export function getAttachmentUnique(attachments: ApiMessageAttachment[]) {
	return Object.values(
		attachments.reduce((acc: any, cur: any) => {
			if (!acc[cur.filename] || cur.size) {
				acc[cur.filename] = cur;
			}
			return acc;
		}, {})
	);
}

export const getChannelById = (channelHashtagId: string, channelsEntities?: Record<string, ChannelsEntity>) => {
	if (!channelsEntities) return;
	return channelsEntities[channelHashtagId];
};

export const convertToPlainTextHashtag = (text: string) => {
	const hashtagPattern = /\{\#\}\[(.*?)\]\(\d+\)/g;
	text = text.replace(hashtagPattern, (match, p1) => `#${p1}`);
	const mentionPattern = /\{\@\}\[(.*?)\]\(\d+\)/g;
	text = text.replace(mentionPattern, (match, p1) => `@${p1}`);

	return text;
};

export const codeBlockRegex = /^```[\s\S]*```$/;
export const codeBlockRegexGlobal = /```[\s\S]*?```/g;
export const markdownDefaultUrlRegex = /^\[.*?\]\(https?:\/\/[^\s]+\)$/;
export const splitBlockCodeRegex =
	/(```[\s\S]*?```)|(https?:\/\/[^\s]+)|(<#\d+>)|(@[\w.]+)|(\w+)|(\s+)|(\[.*?\]\(https?:\/\/[^\s]+\))|(:[a-zA-Z0-9_]+:)/g;
export const urlRegex = /(https?:\/\/[^\s]+)/g;
export const validLinkGoogleMapRegex = /^https:\/\/(www\.)?google\.com\/maps\?q=(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)(&.*)?$/;
export const validLinkInviteRegex = /https:\/\/mezon\.ai\/invite\/[0-9]+/;
export const inviteLinkRegex = /https:\/\/mezon\.ai\/invite\/([0-9]+)/;
export const pushAttachmentToCache = (attachment: any, channelId: string | number) => {
	const allCachedAttachment = load(STORAGE_KEY_TEMPORARY_ATTACHMENT) || {};

	if (Array.isArray(attachment)) {
		save(STORAGE_KEY_TEMPORARY_ATTACHMENT, {
			...allCachedAttachment,
			[channelId]: attachment
		});
	} else {
		const currentAttachment = allCachedAttachment[channelId] || [];
		currentAttachment.push(attachment);

		save(STORAGE_KEY_TEMPORARY_ATTACHMENT, {
			...allCachedAttachment,
			[channelId]: currentAttachment
		});
	}
};

export const filterContent = (content: IMessageSendPayload) => {
	const result: Partial<IMessageSendPayload> = {};

	if (content?.t?.trim() !== '') {
		result.t = content.t;
	}
	if (content.ej && content.ej.length > 0) {
		result.ej = content.ej;
	}
	if (content.hg && content.hg.length > 0) {
		result.hg = content.hg;
	}
	if (content.lk && content.lk.length > 0) {
		result.lk = content.lk;
	}
	if (content.mk && content.mk.length > 0) {
		result.mk = content.mk;
	}

	if (content.vk && content.vk.length > 0) {
		result.vk = content.vk;
	}

	return Object.keys(result).length > 0 ? (result as IMessageSendPayload) : undefined;
};
