import { useAuth, useSeenMessagePool } from '@mezon/core';
import {
	DMCallActions,
	appActions,
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
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType, WebrtcSignalingFwd, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { useEffect } from 'react';
import { AppState, NativeModules, Platform, View } from 'react-native';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { useDispatch, useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';

const { SharedPreferences } = NativeModules;
function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const statusFetchChannel = useSelector(selectFetchChannelStatus);
	const resetBadgeCount = !useSelector(selectAnyUnreadChannels);

	const { markAsReadSeen } = useSeenMessagePool();
	useEffect(() => {
		const mode =
			currentChannel?.type === ChannelType.CHANNEL_TYPE_TEXT ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_THREAD;
		if (lastMessage) {
			markAsReadSeen(lastMessage, mode);
		}
	}, [lastMessage, channelId, markAsReadSeen, currentChannel?.type]);

	useEffect(() => {
		if (!statusFetchChannel) return;
		const numberNotification = currentChannel?.count_mess_unread ? currentChannel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
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

function DrawerListener({ channelId }: { channelId: string }) {
	useChannelSeen(channelId || '');
	const dispatch = useDispatch();
	const navigation = useNavigation<any>();
	const { userProfile } = useAuth();

	useEffect(() => {
		let appStateSubscription;
		let timer;

		const getDataCall = async () => {
			try {
				const notificationData = await SharedPreferences.getItem('notificationDataCalling');
				const notificationDataParse = safeJSONParse(notificationData || '{}');
				const data = safeJSONParse(notificationDataParse?.offer || '{}');
				if (data?.offer !== 'CANCEL_CALL' && !!data?.offer) {
					dispatch(appActions.setLoadingMainMobile(true));
					dispatch(DMCallActions.setIsInCall(true));
					const payload = safeJSONParse(notificationDataParse?.offer || '{}');
					const signalingData = {
						channel_id: payload?.channelId,
						json_data: payload?.offer,
						data_type: WebrtcSignalingType.WEBRTC_SDP_OFFER,
						caller_id: payload?.callerId
					};
					dispatch(
						DMCallActions.addOrUpdate({
							calleeId: userProfile?.user?.id,
							signalingData: signalingData as WebrtcSignalingFwd,
							id: payload?.callerId,
							callerId: payload?.callerId
						})
					);
					timer = setTimeout(() => {
						dispatch(appActions.setLoadingMainMobile(false));
						navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
							params: {
								receiverId: payload?.callerId,
								receiverAvatar: payload?.callerAvatar,
								directMessageId: payload?.channelId,
								isAnswerCall: true
							}
						});
					}, 500);
					RNNotificationCall.declineCall('6cb67209-4ef9-48c0-a8dc-2cec6cd6261d');
					await SharedPreferences.removeItem('notificationDataCalling');
				}
			} catch (error) {
				console.error('Failed to retrieve data', error);
			}
		};

		if (Platform.OS === 'android') {
			getDataCall();
			appStateSubscription = AppState.addEventListener('change', (state) => {
				if (state === 'active') {
					getDataCall();
				}
			});
		}
		return () => {
			if (appStateSubscription) appStateSubscription.remove();
			if (timer) clearTimeout(timer);
		};
	}, [dispatch, navigation, userProfile?.user?.id]);

	return <View />;
}

export default React.memo(DrawerListener);
