import { ActionEmitEvent } from '@mezon/mobile-components';
import { selectCurrentChannel, selectDmGroupCurrentId } from '@mezon/store-mobile';
import notifee from '@notifee/react-native';
import { memo, useCallback, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';

const RemoveNotificationListener = () => {
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDirectId = useSelector(selectDmGroupCurrentId);

	const triggerRemoveByChannelId = useCallback(async (channelId: string) => {
		try {
			const displayedNotifications = await notifee.getDisplayedNotifications();
			const notificationsToRemove = displayedNotifications.filter((item) => item.notification?.data?.channel === channelId);

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
			const channelId = currentDirectId || currentChannel?.channel_id;

			if (!channelId) {
				return;
			}
			await triggerRemoveByChannelId(channelId);
		};

		removeNotificationsByChannelId();
	}, [currentChannel?.channel_id, currentDirectId, triggerRemoveByChannelId]);

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

	return null;
};

export default memo(RemoveNotificationListener);
