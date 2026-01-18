import type { ChannelMessage } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import type { ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import type { IMessageMention, IMessageRef, IMessageWithUser } from '../types';
import { EMessageCode } from '../types';

interface MessagesEntity extends IMessageWithUser {
	id: string; // Primary ID
	channel_id: string;
	isStartedMessageGroup?: boolean;
	isStartedMessageOfTheDay?: boolean;
	hide_editted?: boolean;
	code: number;
}

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

const mapMention = (mention: ApiMessageMention): IMessageMention => ({
	...mention,
	id: String(mention.id),
	user_id: String(mention.user_id),
	role_id: String(mention.role_id),
	channel_id: String(mention.channel_id)
});

const mapMessageRef = (ref: ApiMessageRef): IMessageRef => ({
	...ref,
	message_id: String(ref.message_id),
	message_ref_id: String(ref.message_ref_id),
	message_sender_id: String(ref.message_sender_id),
	channel_id: ref.channel_id
});

const mapMessageChannelToEntity = (channelMess: ChannelMessage, lastSeenId?: string): IMessageWithUser => {
	const creationTime = new Date(channelMess.create_time_seconds || '');
	const isAnonymous = String(channelMess?.sender_id) === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	return {
		...channelMess,
		mentions: channelMess.mentions?.map(mapMention) || [],
		references: channelMess.references?.map(mapMessageRef) || [],
		topic_id: String(channelMess.topic_id),
		message_id: String(channelMess.message_id),
		sender_id: String(channelMess.sender_id),
		clan_id: String(channelMess.clan_id),
		channel_id: String(channelMess.channel_id),
		isFirst: channelMess.code === EMessageCode.FIRST_MESSAGE,
		creationTime,
		id: String(channelMess.id) || String(channelMess.message_id) || '',
		date: new Date().toLocaleString(),
		isAnonymous,
		user: {
			name: channelMess.username || '',
			username: channelMess.username || '',
			id: String(channelMess.sender_id) || ''
		},
		lastSeen: lastSeenId === (channelMess.id || channelMess.message_id),
		create_time_seconds: channelMess.create_time_seconds || creationTime.getTime() / 1000
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
