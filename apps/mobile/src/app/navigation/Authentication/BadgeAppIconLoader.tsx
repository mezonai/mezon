import { useFriends } from '@mezon/core';
import { selectAnyUnreadChannel, selectBadgeCountAllClan, selectTotalUnreadDM, useAppSelector } from '@mezon/store-mobile';
import notifee from '@notifee/react-native';
import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useSelector } from 'react-redux';

export const BadgeAppIconLoader = () => {
	const hasUnreadChannel = useAppSelector((state) => selectAnyUnreadChannel(state));
	const allNotificationReplyMentionAllClan = useSelector(selectBadgeCountAllClan);
	const totalUnreadMessages = useSelector(selectTotalUnreadDM);
	const { quantityPendingRequest } = useFriends();

	const setBadgeOnAndroid = async (count: number) => {
		try {
			const BadgeModule = NativeModules?.BadgeModule;
			if (count <= 0) {
				await BadgeModule.removeBadge();
			}
			await BadgeModule.setBadgeCount(count);
		} catch (error) {
			console.error('Error setting badge count on Android:', error);
		}
	};

	useEffect(() => {
		try {
			let notificationCountAllClan = 0;
			notificationCountAllClan = allNotificationReplyMentionAllClan < 0 ? 0 : allNotificationReplyMentionAllClan;
			const notificationCount = notificationCountAllClan + totalUnreadMessages + quantityPendingRequest;

			if (hasUnreadChannel && !notificationCount) {
				if (Platform.OS === 'ios') {
					notifee?.setBadgeCount(0);
				} else {
					setBadgeOnAndroid(0);
				}
				notifee?.setBadgeCount(0);
				return;
			}
			if (Platform.OS === 'ios') {
				notifee?.setBadgeCount(notificationCount);
			} else {
				setBadgeOnAndroid(notificationCount);
			}
		} catch (e) {
			console.error('log  => error BadgeAppIconLoader', e);
		}
	}, [allNotificationReplyMentionAllClan, totalUnreadMessages, quantityPendingRequest, hasUnreadChannel]);
	return null;
};
