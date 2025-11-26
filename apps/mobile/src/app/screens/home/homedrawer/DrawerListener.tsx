import { MobileEventEmitter, useSeenMessagePool } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import type { ChannelsEntity } from '@mezon/store-mobile';
import {
	channelMembersActions,
	channelsActions,
	selectChannelById,
	selectLastMessageByChannelId,
	sleep,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import ReasonPopup from './components/ChannelVoice/ReasonPopup';

const ChannelSeen = memo(
	({ channelId }: { channelId: string }) => {
		const dispatch = useAppDispatch();
		const currentChannel = useAppSelector((state) => selectChannelById(state, channelId as string));
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
		const { markAsReadSeen } = useSeenMessagePool();
		const handleReadMessage = useCallback(() => {
			if (!lastMessage) {
				return;
			}
			const mode =
				currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL || currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING
					? ChannelStreamMode.STREAM_MODE_CHANNEL
					: ChannelStreamMode.STREAM_MODE_THREAD;
			markAsReadSeen(lastMessage, mode, currentChannel?.count_mess_unread || 0);
		}, [lastMessage, currentChannel, markAsReadSeen]);

		useEffect(() => {
			if (currentChannel.type === ChannelType.CHANNEL_TYPE_THREAD) {
				const channelWithActive = { ...currentChannel, active: 1 };
				dispatch(
					channelsActions.upsertOne({
						clanId: currentChannel?.clan_id || '',
						channel: channelWithActive as ChannelsEntity
					})
				);
			}
		}, [currentChannel?.id]);

		useEffect(() => {
			if (lastMessage) {
				handleReadMessage();
			}
		}, [lastMessage, handleReadMessage]);

		return null;
	},
	(prevProps, nextProps) => {
		return prevProps?.channelId === nextProps?.channelId;
	}
);

function DrawerListener({ channelId }: { channelId: string }) {
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const prevChannelIdRef = useRef<string>('');
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('message');

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

	const onRemoveUserChannel = useCallback(
		async ({ channelId: removeChannelId, channelType, isRemoveClan = false }) => {
			if (
				(channelId === removeChannelId &&
					(channelType === ChannelType.CHANNEL_TYPE_CHANNEL ||
						channelType === ChannelType.CHANNEL_TYPE_THREAD ||
						channelType === ChannelType.CHANNEL_TYPE_GROUP)) ||
				isRemoveClan
			) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(200);
				const data = {
					children: (
						<ReasonPopup
							title={t('removeFromChannel.title')}
							confirmText={t('removeFromChannel.button')}
							content={t('removeFromChannel.content')}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
				if (!isRemoveClan) {
					dispatch(channelsActions.setCurrentChannelId({ clanId: currentChannel.clan_id || '', channelId: '' }));
				}
				navigation.navigate(APP_SCREEN.BOTTOM_BAR);
			}
		},
		[channelId, navigation, t]
	);

	useEffect(() => {
		MobileEventEmitter.addListener(ActionEmitEvent.ON_REMOVE_USER_CHANNEL, onRemoveUserChannel);
		return () => {
			MobileEventEmitter.removeListener(ActionEmitEvent.ON_REMOVE_USER_CHANNEL, onRemoveUserChannel);
		};
	}, [channelId]);

	if (!currentChannel) {
		return null;
	}

	return <ChannelSeen channelId={channelId} />;
}

export default React.memo(DrawerListener);
