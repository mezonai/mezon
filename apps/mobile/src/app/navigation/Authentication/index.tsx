import React, { memo, useEffect, useRef, useState } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ColorRoleProvider } from '@mezon/mobile-ui';
import notifee from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import { getInitialNotification, getMessaging } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex } from '../../utils/helpers';
import { APP_SCREEN } from '../ScreenTypes';
import { RootAuthStack } from './RootAuthStack';
const messaging = getMessaging(getApp());
export const Authentication = memo(() => {
	const isTabletLandscape = useTabletLandscape();
	const [initRouteName, setInitRouteName] = useState<string>('');
	const notiInitRef = useRef<any>(null);

	const getInitRouterName = async () => {
		let routeName: string = APP_SCREEN.BOTTOM_BAR;
		try {
			const remoteMessage: any = Platform.OS === 'ios' ? await getInitialNotification(messaging) : await notifee.getInitialNotification();
			const notification = { ...(remoteMessage?.notification || {}), data: remoteMessage?.data || remoteMessage?.notification?.data };

			if (notification?.data?.link) {
				notiInitRef.current = notification;
				const link = notification.data.link;
				if (clanAndChannelIdLinkRegex.test(link)) {
					routeName = APP_SCREEN.HOME_DEFAULT;
				} else if (clanDirectMessageLinkRegex.test(link)) {
					routeName = APP_SCREEN.MESSAGES.MESSAGE_DETAIL;
				}
			}
			setInitRouteName(routeName);
		} catch (e) {
			console.error('log  => error getInitRouterName', e);
			setInitRouteName(routeName);
		}
	};

	useEffect(() => {
		getInitRouterName();
	}, []);

	if (!initRouteName) return null;

	return (
		<BottomSheetModalProvider>
			<ColorRoleProvider>
				<RootAuthStack isTabletLandscape={isTabletLandscape} notifyInit={notiInitRef?.current} initRouteName={initRouteName} />
			</ColorRoleProvider>
		</BottomSheetModalProvider>
	);
});
