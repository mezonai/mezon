import {
	channelMembersActions,
	channelMetaActions,
	ChannelsEntity,
	channelUsersActions,
	selectAllChannelMembers,
	selectChannelById,
	ThreadsEntity,
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

	const membersOfChild = useAppSelector((state) => (channelId ? selectAllChannelMembers(state, channelId as string) : null));
	const membersOfParent = useAppSelector((state) => (channel?.parrent_id ? selectAllChannelMembers(state, channel.parrent_id as string) : null));

	const dispatch = useAppDispatch();

	const updateChannelUsers = async (currentChannel: ChannelsEntity | null, userIds: string[], clanId: string) => {
		const timestamp = Date.now() / 1000;

		const body = {
			channelId: currentChannel?.channel_id as string,
			channelType: currentChannel?.type,
			userIds: userIds,
			clanId: clanId
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
						senderId: currentChannel?.last_sent_message?.sender_id || ''
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
			await updateChannelUsers(currentChannel, notExistingUserIds, currentChannel?.clan_id as string);
		},
		[dispatch, membersOfChild]
	);

	const joinningToThread = useCallback(
		async (targetThread: ThreadsEntity | null, user: string[]) => {
			await updateChannelUsers(targetThread as ChannelsEntity, user, targetThread?.clan_id as string);
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			membersOfParent: mode === ChannelStreamMode.STREAM_MODE_CHANNEL && channel?.parrent_id !== '0' ? membersOfParent : membersOfChild,
			membersOfChild,
			addMemberToThread,
			joinningToThread
		}),
		[membersOfChild, membersOfParent, mode, channel?.parrent_id, addMemberToThread, joinningToThread]
	);
}
