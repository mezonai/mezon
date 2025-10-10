import {
	channelMembersActions,
	inviteActions,
	selectAllChannels,
	selectAllDirectMessages,
	selectAllUserClans,
	selectBlockedUsers,
	useAppDispatch
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import type { ApiLinkInviteUser } from 'mezon-js/api.gen';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useDMInvite(channelID?: string) {
	const dispatch = useAppDispatch();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const usersClan = useSelector(selectAllUserClans);
	const allChannels = useSelector(selectAllChannels);
	const isChannelPrivate = allChannels.find((channel) => channel.channel_id === channelID)?.channel_private === 1;
	const blockedUsers = useSelector(selectBlockedUsers);

	const listDMInvite = useMemo(() => {
		const userIdInClanArray = usersClan.map((user) => user.id);
		const blockedUserIds = blockedUsers.map((user) => user.id);

		const filteredListUserClan = dmGroupChatList.filter((item) => {
			const hasBlockedUser = item.user_ids?.some((userId) => blockedUserIds.includes(userId));
			if (hasBlockedUser) {
				return false;
			}

			if (
				(item.user_ids && item.user_ids.length > 1) ||
				(item.user_ids && item.user_ids.length === 1 && !userIdInClanArray.includes(item.user_ids[0]))
			) {
				return true;
			}
			return false;
		});
		if (!channelID) {
			return filteredListUserClan;
		}
		const filteredListUserChannel = dmGroupChatList.filter((item) => {
			const hasBlockedUser = item.user_ids?.some((userId) => blockedUserIds.includes(userId));
			if (hasBlockedUser) {
				return false;
			}

			if ((item.user_ids && item.user_ids.length > 1) || (item.user_ids && item.user_ids.length === 1)) {
				return true;
			}
			return false;
		});
		if (!isChannelPrivate) {
			return filteredListUserChannel;
		}
	}, [channelID, dmGroupChatList, usersClan, isChannelPrivate, blockedUsers]);

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
