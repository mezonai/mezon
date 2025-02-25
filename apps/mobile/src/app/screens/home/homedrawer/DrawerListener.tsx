import { useSeenMessagePool } from '@mezon/core';
import {
	channelMembersActions,
	channelMetaActions,
	channelsActions,
	clansActions,
	listChannelRenderAction,
	listChannelsByUserActions,
	selectAnyUnreadChannels,
	selectChannelById,
	selectCurrentChannel,
	selectFetchChannelStatus,
	selectLastMessageByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { TIME_OFFSET } from '@mezon/utils';
import { useFocusEffect } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const statusFetchChannel = useSelector(selectFetchChannelStatus);
	const resetBadgeCount = !useSelector(selectAnyUnreadChannels);

	const { markAsReadSeen } = useSeenMessagePool();
	useEffect(() => {
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD;
		if (lastMessage) {
			markAsReadSeen(lastMessage, mode);
		}
	}, [lastMessage, channelId, markAsReadSeen, currentChannel?.type]);

	useEffect(() => {
		if (!statusFetchChannel) return;
		const numberNotification = currentChannel?.count_mess_unread ? currentChannel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
			dispatch(
				listChannelRenderAction.removeBadgeFromChannel({
					clanId: currentChannel.clan_id as string,
					channelId: currentChannel.channel_id as string
				})
			);
			dispatch(
				channelsActions.updateChannelBadgeCount({ clanId: currentChannel?.clan_id ?? '', channelId: channelId, count: 0, isReset: true })
			);
			dispatch(listChannelsByUserActions.resetBadgeCount({ channelId: channelId }));
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: numberNotification * -1 }));
		}
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
		if (!numberNotification && resetBadgeCount) {
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: 0, isReset: true }));
		}
	}, [currentChannel?.id, statusFetchChannel, channelId, currentChannel, dispatch, resetBadgeCount]);
}

function DrawerListener() {
	const currentChannel = useSelector(selectCurrentChannel);
	const prevChannelIdRef = useRef<string>();
	const dispatch = useAppDispatch();
	useChannelSeen(currentChannel?.channel_id || '');

	const fetchMemberChannel = useCallback(async () => {
		if (!currentChannel) {
			return;
		}
		await dispatch(
			channelMembersActions.fetchChannelMembers({
				clanId: currentChannel?.clan_id || '',
				channelId: (currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? currentChannel?.parrent_id : currentChannel?.channel_id) || '',
				channelType: ChannelType.CHANNEL_TYPE_CHANNEL
			})
		);
	}, [currentChannel, dispatch]);

	useFocusEffect(
		useCallback(() => {
			if (prevChannelIdRef.current !== currentChannel?.channel_id) {
				fetchMemberChannel();
			}
			prevChannelIdRef.current = currentChannel?.channel_id;
		}, [currentChannel?.channel_id])
	);

	return <View />;
}

export default React.memo(DrawerListener);
