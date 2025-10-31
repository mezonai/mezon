import {
	channelMembersActions,
	EStateFriend,
	inviteActions,
	selectAllChannels,
	selectAllDirectMessages,
	selectAllUserClans,
	selectFriendsEntities,
	useAppDispatch
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import type { ApiLinkInviteUser } from 'mezon-js/api.gen';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

export function useDMInvite(channelID?: string) {
	const dispatch = useAppDispatch();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const { userId } = useAuth();
	const usersClan = useSelector(selectAllUserClans);
	const allChannels = useSelector(selectAllChannels);
	const isChannelPrivate = allChannels.find((channel) => channel.channel_id === channelID)?.channel_private === 1;
	const friendList = useSelector(selectFriendsEntities);

	const listDMInvite = useMemo(() => {
		const userIdInClanArray = usersClan.map((user) => user.id);
		const listId = new Set<string>();
		const filteredListUserClan = dmGroupChatList.filter((item) => {
			const friend = friendList[item.user_ids?.[0] || ''];
			const hasBlockedUser = friend?.state === EStateFriend.BLOCK && (friend?.source_id === userId || friend.user?.id === userId);
			if (hasBlockedUser) {
				return false;
			}

			if (
				(item.user_ids && item.user_ids.length > 1) ||
				(item.user_ids && item.user_ids.length === 1 && !userIdInClanArray.includes(item.user_ids[0]))
			) {
				listId.add(item.user_ids[0]);
				return true;
			}
			return false;
		});

		Object.values(friendList).forEach((friend) => {
			const hasBlockedUser = friend?.state === EStateFriend.BLOCK && (friend?.source_id === userId || friend.user?.id === userId);
			if (hasBlockedUser || listId.has(friend.user?.id || '')) {
				return;
			}
			filteredListUserClan.push({
				id: friend.user?.id || '',
				user_ids: [friend.user?.id || ''],
				usernames: [friend.user?.username || ''],
				channel_label: friend.user?.display_name || friend.user?.username || '',
				avatars: [friend.user?.avatar_url || ''],
				type: ChannelType.CHANNEL_TYPE_DM
			});
			listId.add(friend.user?.id || '');
		});
		return filteredListUserClan;
	}, [channelID, dmGroupChatList, usersClan, isChannelPrivate, friendList]);

	const createLinkInviteUser = React.useCallback(
		async (clan_id: string, channel_id: string, expiry_time: number) => {
			const action = await dispatch(
				inviteActions.createLinkInviteUser({
					clan_id,
					channel_id,
					expiry_time
				})
			);
			const payload = action.payload as ApiLinkInviteUser;
			return payload;
		},
		[dispatch]
	);

	useEffect(() => {
		if (channelID)
			dispatch(
				channelMembersActions.fetchChannelMembers({ clanId: '', channelId: channelID || '', channelType: ChannelType.CHANNEL_TYPE_CHANNEL })
			);
	}, [channelID, dispatch]);

	return useMemo(
		() => ({
			listDMInvite,
			createLinkInviteUser
		}),
		[listDMInvite, createLinkInviteUser]
	);
}
