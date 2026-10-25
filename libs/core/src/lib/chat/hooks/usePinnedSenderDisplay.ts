import { selectDirectById, useAppSelector } from '@mezon/store';
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

function getDirectParticipant(directChannel: ReturnType<typeof selectDirectById> | undefined, senderId: string) {
	if (!directChannel?.user_ids?.length || !senderId) {
		return { directAvatar: '', directName: '' };
	}
	const userIndex = directChannel.user_ids.findIndex((id) => String(id) === senderId);
	if (userIndex === -1) {
		return { directAvatar: '', directName: '' };
	}
	return {
		directAvatar: directChannel.avatars?.[userIndex] || '',
		directName: directChannel.display_names?.[userIndex] || directChannel.usernames?.[userIndex] || ''
	};
}

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
	const directChannel = useAppSelector((state) => (channelId ? selectDirectById(state, channelId) : undefined));

	const { directAvatar, directName } = useMemo(() => getDirectParticipant(directChannel, senderId), [directChannel, senderId]);

	const isDirectMode = mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP;
	const isAnonymous = isAnonymousOverride ?? (isAnonymousSender || senderId === NX_CHAT_APP_ANNONYMOUS_USER_ID);

	const displayName = useMemo(() => {
		const nameFromMessage = getShowName(message?.clan_nick ?? '', message?.display_name ?? '', message?.username ?? '', senderId) || '';

		if (isDirectMode) {
			return nameFromMessage || directName || namePriority || pinUsername || '';
		}
		return nameFromMessage || namePriority || pinUsername || directName || '';
	}, [message?.clan_nick, message?.display_name, message?.username, senderId, isDirectMode, directName, namePriority, pinUsername]);

	const displayAvatar = useMemo(() => {
		if (isAnonymous) {
			return message?.avatar || '';
		}
		if (isDirectMode) {
			return directAvatar || priorityAvatar || message?.avatar || pinAvatar || '';
		}
		return priorityAvatar || message?.clan_avatar || message?.avatar || pinAvatar || directAvatar || '';
	}, [isAnonymous, isDirectMode, message?.avatar, message?.clan_avatar, pinAvatar, directAvatar, priorityAvatar]);

	return {
		displayName,
		displayAvatar,
		isAnonymous
	};
}
