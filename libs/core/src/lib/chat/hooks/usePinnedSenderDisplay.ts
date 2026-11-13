import { NX_CHAT_APP_ANNONYMOUS_USER_ID } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useMemo } from 'react';
import { useGetPriorityNameFromUserClan } from './useGetPriorityNameFromUserClan';
import { getShowName } from './useShowName';

export type PinnedSenderMessageSnapshot = {
	clan_nick?: string;
	display_name?: string;
	username?: string;
	clan_avatar?: string;
	avatar?: string;
};

export type UsePinnedSenderDisplayOptions = {
	senderId: string;
	channelId?: string;
	mode?: number;
	message?: PinnedSenderMessageSnapshot | null;
	pinAvatar?: string;
	pinUsername?: string;
	isAnonymous?: boolean;
};

export function usePinnedSenderDisplay({
	senderId,
	channelId = '',
	mode,
	message,
	pinAvatar,
	pinUsername,
	isAnonymous: isAnonymousOverride
}: UsePinnedSenderDisplayOptions) {
	const { priorityAvatar, namePriority, isAnonymous: isAnonymousSender } = useGetPriorityNameFromUserClan(senderId);

	const isDirectMode = mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP;
	const isAnonymous = isAnonymousOverride ?? (isAnonymousSender || senderId === NX_CHAT_APP_ANNONYMOUS_USER_ID);

	const displayName = useMemo(() => {
		const nameFromMessage = getShowName(message?.clan_nick ?? '', message?.display_name ?? '', message?.username ?? '', senderId) || '';

		if (isDirectMode) {
			return nameFromMessage || namePriority || pinUsername || '';
		}

		return nameFromMessage || namePriority || pinUsername || '';
	}, [message?.clan_nick, message?.display_name, message?.username, senderId, isDirectMode, namePriority, pinUsername]);

	const displayAvatar = useMemo(() => {
		if (isAnonymous) {
			return message?.avatar || '';
		}
		if (isDirectMode) {
			return priorityAvatar || message?.avatar || pinAvatar || '';
		}
		return priorityAvatar || message?.clan_avatar || message?.avatar || pinAvatar || '';
	}, [isAnonymous, isDirectMode, message?.avatar, pinUsername, message?.clan_avatar, pinAvatar, priorityAvatar]);

	return {
		displayName,
		displayAvatar,
		isAnonymous
	};
}
