import { useSeenMessagePool } from '@mezon/core';
import {
	channelMembersActions,
	channelsActions,
	ChannelsEntity,
	selectChannelById,
	selectLastMessageByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { useFocusEffect } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';

const ChannelSeen = memo(
	({ currentChannel }: { currentChannel: IChannel }) => {
		const dispatch = useAppDispatch();
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, currentChannel?.id));

		const { markAsReadSeen } = useSeenMessagePool();

		const handleReadMessage = useCallback(() => {
			if (!lastMessage || !currentChannel) {
				return;
			}
			const mode =
				currentChannel.type === ChannelType.CHANNEL_TYPE_CHANNEL || currentChannel.type === ChannelType.CHANNEL_TYPE_STREAMING
					? ChannelStreamMode.STREAM_MODE_CHANNEL
					: ChannelStreamMode.STREAM_MODE_THREAD;
			markAsReadSeen(lastMessage, mode, currentChannel.count_mess_unread || 0);
		}, [lastMessage?.id, currentChannel?.count_mess_unread, currentChannel?.id, currentChannel?.type, markAsReadSeen]);

		useEffect(() => {
			if (!currentChannel) return;

			if (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD) {
				const channelWithActive = { ...currentChannel, active: 1 };
				dispatch(
					channelsActions.upsertOne({
						clanId: currentChannel.clan_id || '',
						channel: channelWithActive as ChannelsEntity
					})
				);
			}
		}, [currentChannel?.id, currentChannel?.type, currentChannel?.clan_id, dispatch]);

		useEffect(() => {
			if (lastMessage) {
				handleReadMessage();
			}
		}, [currentChannel?.id, handleReadMessage, lastMessage?.id]);

		return null;
	},
	(prevProps, nextProps) => {
		const prev = prevProps?.currentChannel;
		const next = nextProps?.currentChannel;

		if (!prev && !next) return true;
		if (!prev || !next) return false;

		return prev?.id === next?.id && prev?.type === next?.type && prev?.clan_id === next?.clan_id;
	}
);

function DrawerListener({ channelId }: { channelId: string }) {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const prevChannelIdRef = useRef<string>('');
	const dispatch = useAppDispatch();

	const fetchMemberChannel = useCallback(async () => {
		if (!currentChannel) {
			return;
		}
		await dispatch(
			channelMembersActions.fetchChannelMembers({
				clanId: currentChannel.clan_id || '',
				channelId: (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD ? currentChannel.parent_id : currentChannel.channel_id) || '',
				channelType: ChannelType.CHANNEL_TYPE_CHANNEL
			})
		);
	}, [currentChannel?.clan_id, currentChannel?.type, currentChannel?.parent_id, currentChannel?.channel_id, dispatch]);

	useFocusEffect(
		useCallback(() => {
			if (prevChannelIdRef.current !== currentChannel?.channel_id) {
				fetchMemberChannel();
			}
			prevChannelIdRef.current = currentChannel?.channel_id || '';
		}, [currentChannel?.channel_id, fetchMemberChannel])
	);

	if (!currentChannel) {
		return null;
	}

	return (
		<View>
			<ChannelSeen currentChannel={currentChannel} />
		</View>
	);
}

export default React.memo(DrawerListener);
