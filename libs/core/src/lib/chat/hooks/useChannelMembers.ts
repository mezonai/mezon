import type { ChannelsEntity, ThreadsEntity } from '@mezon/store';
import {
	channelMembersActions,
	channelMetaActions,
	channelUsersActions,
	selectAllAccount,
	selectAllChannelMembers,
	selectChannelById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelStreamMode } from 'mezon-js';
import { useCallback, useMemo } from 'react';

export type useChannelMembersOptions = {
	channelId?: string | null;
	mode: number;
};

export function useChannelMembers({ channelId, mode }: useChannelMembersOptions) {
	const channel = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};
	const userProfile = useAppSelector(selectAllAccount);

	const membersOfChild = useAppSelector((state) => (channelId ? selectAllChannelMembers(state, channelId as string) : null));
	const membersOfParent = useAppSelector((state) => (channel?.parent_id ? selectAllChannelMembers(state, channel.parent_id as string) : null));

	const dispatch = useAppDispatch();

	const updateChannelUsers = async (currentChannel: ChannelsEntity | null, userIds: string[], clanId: string) => {
		const timestamp = Date.now() / 1000;

		const body = {
			channelId: currentChannel?.channel_id as string,
			channelType: currentChannel?.type,
			userIds,
			clanId
		};

		try {
			await dispatch(channelUsersActions.addChannelUsers(body));
			dispatch(
				channelMetaActions.updateBulkChannelMetadata([
					{
						id: currentChannel?.channel_id ?? '',
						lastSeenTimestamp: timestamp,
						lastSentTimestamp: timestamp,
						clanId: currentChannel?.clan_id ?? '',
						isMute: false,
						senderId: String(currentChannel?.last_sent_message?.sender_id || '')
					}
				])
			);
			dispatch(channelMembersActions.addNewMember({ channel_id: currentChannel?.channel_id ?? '', user_ids: userIds }));
		} catch (error) {
			console.error(error);
		}
	};

	const addMemberToThread = useCallback(
		async (currentChannel: ChannelsEntity | null, notExistingUserIds: string[]) => {
			const currentUserId = userProfile?.user?.id;
			const filteredUserIds = currentUserId ? notExistingUserIds.filter((userId) => userId !== currentUserId) : notExistingUserIds;
			if (filteredUserIds.length > 0) {
				await updateChannelUsers(currentChannel, filteredUserIds, currentChannel?.clan_id as string);
			}
		},
		[dispatch, membersOfChild, userProfile?.user?.id]
	);

	const joinningToThread = useCallback(
		async (targetThread: ThreadsEntity | null, user: string[]) => {
			await updateChannelUsers(targetThread as ChannelsEntity, user, targetThread?.clan_id as string);
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			membersOfParent:
				(mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD) && channel?.parent_id !== '0'
					? membersOfParent
					: membersOfChild,
			membersOfChild,
			addMemberToThread,
			joinningToThread
		}),
		[membersOfChild, membersOfParent, mode, channel?.parent_id, addMemberToThread, joinningToThread]
	);
}
