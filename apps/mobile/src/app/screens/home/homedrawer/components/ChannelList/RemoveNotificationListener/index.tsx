import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectCurrentChannel, selectDmGroupCurrentId } from '@mezon/store-mobile';
import notifee from '@notifee/react-native';
import { memo, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useSelector } from 'react-redux';

const RemoveNotificationListener = () => {
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectId = useSelector(selectDmGroupCurrentId);

	const triggerRemoveByChannelId = useCallback(async (channelId: string) => {
		try {
			const displayedNotifications = await notifee.getDisplayedNotifications();
			const notificationsToRemove = displayedNotifications.filter((item) => item.notification?.data?.channel === channelId);
			if (Platform.OS === 'android') {
				const channelGroups = await notifee.getChannelGroups();
				for (const group of channelGroups) {
					if (group?.id === channelId) {
						await notifee.deleteChannel(group.id);
						await notifee.deleteChannelGroup(group.id);
					}
				}
			}
			for (const notification of notificationsToRemove) {
				if (notification.id) {
					await notifee.cancelDisplayedNotification(notification.id);
				}
			}
		} catch (error) {
			console.error('Error removing notifications:', error);
		}
	}, []);

	useEffect(() => {
		const removeNotificationsByChannelId = async () => {
			const channelId = currentDirectId || currentChannel?.channelId;

			if (!channelId) {
				return;
			}
			await triggerRemoveByChannelId(channelId);
		};

		removeNotificationsByChannelId();
	}, [currentChannel?.channelId, currentDirectId, triggerRemoveByChannelId]);

	useEffect(() => {
		const onRemoveNotifyListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_REMOVE_NOTIFY_BY_CHANNEL_ID, ({ channelId = '' }) => {
			if (channelId) {
				triggerRemoveByChannelId(channelId);
			}
		});
		return () => {
			onRemoveNotifyListener.remove();
		};
	}, [triggerRemoveByChannelId]);

	const removeOngoingCallAndroid = useCallback(async () => {
		try {
			await notifee.deleteChannel('ongoing-call');
			await notifee.deleteChannelGroup('ongoing-call');
			await notifee.cancelDisplayedNotification('ongoing-call');
		} catch (error) {
			console.error('Error removeOngoingCallAndroid:', error);
		}
	}, []);

	useEffect(() => {
		if (Platform.OS === 'android') {
			removeOngoingCallAndroid();
		}
	}, [removeOngoingCallAndroid]);

	return null;
};

export default memo(RemoveNotificationListener);
