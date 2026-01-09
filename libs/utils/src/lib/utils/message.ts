import type { ChannelMessage } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import type { IMessageWithUser } from '../types';
import { EMessageCode } from '../types';

interface MessagesEntity extends IMessageWithUser {
	id: string; // Primary ID
	channelId: string;
	isStartedMessageGroup?: boolean;
	isStartedMessageOfTheDay?: boolean;
	hideEditted?: boolean;
	code: number;
}

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

const mapMessageChannelToEntity = (channelMess: ChannelMessage, lastSeenId?: string): IMessageWithUser => {
	const isAnonymous = channelMess?.senderId === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	return {
		...channelMess,
		isFirst: channelMess.code === EMessageCode.FIRST_MESSAGE,
		id: channelMess.id || channelMess.messageId || '',
		date: new Date().toLocaleString(),
		isAnonymous,
		user: {
			name: channelMess.username || '',
			username: channelMess.username || '',
			id: channelMess.senderId || ''
		},
		lastSeen: lastSeenId === (channelMess.id || channelMess.messageId),
		createTimeSeconds: channelMess.createTimeSeconds
	};
};

export const parseArrayField = (field: any): any[] => {
	if (!field) return [];
	if (Array.isArray(field)) return field;
	return safeJSONParse(field);
};

export const convertInitialMessageOfTopic = (message: ChannelMessage): MessagesEntity => {
	const entity = mapMessageChannelToEntity(message) as MessagesEntity;

	return {
		...entity,
		mentions: parseArrayField(entity.mentions),
		attachments: parseArrayField(entity.attachments),
		references: parseArrayField(entity.references),
		content: safeJSONParse(entity.content || '')
	};
};

export const convertSearchMessage = (message: ChannelMessage): MessagesEntity => {
	const entity = mapMessageChannelToEntity(message) as MessagesEntity;

	return {
		...entity,
		mentions: parseArrayField(entity.mentions),
		attachments: parseArrayField(entity.attachments),
		references: parseArrayField(entity.references)
	};
};

export function getMeetCode(url: string) {
	const parts = url.split('/');
	if (parts.length < 4) return null;
	let meetCode = parts[3];
	meetCode = meetCode.split('?')[0].split('/')[0];
	return meetCode;
}
