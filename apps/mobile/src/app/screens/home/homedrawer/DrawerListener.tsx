import { useAuth, useSeenMessagePool } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import {
	ChannelsEntity,
	channelMetaActions,
	channelsActions,
	clansActions,
	gifsStickerEmojiActions,
	selectAnyUnreadChannels,
	selectChannelById,
	selectFetchChannelStatus,
	selectIsUnreadChannelById,
	selectLastMessageByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { SubPanelName, TIME_OFFSET } from '@mezon/utils';
import { useDrawerStatus } from '@react-navigation/drawer';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useEffect } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const statusFetchChannel = useSelector(selectFetchChannelStatus);
	const resetBadgeCount = !useSelector(selectAnyUnreadChannels);

	useEffect(() => {
		if (channelId) {
			DeviceEventEmitter.emit(ActionEmitEvent.CHANNEL_ID_ACTIVE, channelId);
		}
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId, currentChannel, dispatch]);

	const { userId } = useAuth();
	const { markAsReadSeen } = useSeenMessagePool();
	const isUnreadChannel = useSelector((state) => selectIsUnreadChannelById(state, channelId));
	useEffect(() => {
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD;
		if (isUnreadChannel || lastMessage?.sender_id === userId) {
			if (lastMessage) {
				markAsReadSeen(lastMessage, mode);
			}
		}
	}, [lastMessage, channelId]);

	useEffect(() => {
		if (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD) {
			const channelWithActive = { ...currentChannel, active: 1 };
			dispatch(channelsActions.upsertOne(channelWithActive as ChannelsEntity));
		}
		if (!statusFetchChannel) return;
		const numberNotification = currentChannel?.count_mess_unread ? currentChannel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
			dispatch(channelsActions.updateChannelBadgeCount({ channelId: channelId, count: 0, isReset: true }));
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: numberNotification * -1 }));
		}
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
		if (!numberNotification && resetBadgeCount) {
			dispatch(clansActions.updateClanBadgeCount({ clanId: currentChannel?.clan_id ?? '', count: 0, isReset: true }));
		}
	}, [currentChannel?.id, statusFetchChannel]);
}

function DrawerListener({ channelId }: { channelId: string }) {
	const isOpenDrawer = useDrawerStatus() === 'open';
	useChannelSeen(channelId || '');

	useEffect(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.OPEN_CLOSE_DRAWER, { isOpenDrawer: isOpenDrawer });
	}, [isOpenDrawer]);
	return <View />;
}

export default React.memo(DrawerListener);
