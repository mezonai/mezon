import { useSeenMessagePool } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import {
	ChannelsEntity,
	channelMetaActions,
	channelsActions,
	clansActions,
	listChannelsByUserActions,
	selectAnyUnreadChannels,
	selectChannelById,
	selectFetchChannelStatus,
	selectLastMessageByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { TIME_OFFSET } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const statusFetchChannel = useSelector(selectFetchChannelStatus);
	const resetBadgeCount = !useSelector(selectAnyUnreadChannels);

	useEffect(() => {
		if (channelId) {
			DeviceEventEmitter.emit(ActionEmitEvent.CHANNEL_ID_ACTIVE, channelId);
		}
	}, [channelId, currentChannel, dispatch]);

	const { markAsReadSeen } = useSeenMessagePool();
	useEffect(() => {
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD;
		if (lastMessage) {
			markAsReadSeen(lastMessage, mode);
		}
	}, [lastMessage, channelId, markAsReadSeen, currentChannel?.type]);

	useEffect(() => {
		if (currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD) {
			const channelWithActive = { ...currentChannel, active: 1 };
			dispatch(channelsActions.upsertOne(channelWithActive as ChannelsEntity));
		}
		if (!statusFetchChannel) return;
		const numberNotification = currentChannel?.count_mess_unread ? currentChannel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
			dispatch(channelsActions.updateChannelBadgeCount({ channelId: channelId, count: 0, isReset: true }));
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

function DrawerListener({ channelId }: { channelId: string }) {
	useChannelSeen(channelId || '');

	return <View />;
}

export default React.memo(DrawerListener);
