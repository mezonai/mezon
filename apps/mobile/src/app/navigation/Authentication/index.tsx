import React, { memo, useContext, useEffect } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ChatContext } from '@mezon/core';
import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import notifee from '@notifee/react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChannelMessage, safeJSONParse } from 'mezon-js';
import { Dimensions, NativeModules, Platform } from 'react-native';
import CallingModalWrapper from '../../components/CallingModalWrapper';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import HomeScreenTablet from '../../screens/home/HomeScreenTablet';
import HomeDefaultWrapper from '../../screens/home/homedrawer/HomeDefaultWrapper';
import ChannelVoicePopup from '../../screens/home/homedrawer/components/ChannelVoicePopup';
import StreamingWrapper from '../../screens/home/homedrawer/components/StreamingWrapper';
import { DirectMessageDetailScreen } from '../../screens/messages/DirectMessageDetail';
import { APP_SCREEN } from '../ScreenTypes';
import BottomNavigatorWrapper from './BottomNavigatorWrapper';
import { FriendStacks } from './stacks/FriendStacks';
import { MenuChannelStacks } from './stacks/MenuChannelStack';
import { MenuClanStacks } from './stacks/MenuSererStack';
import { MenuThreadDetailStacks } from './stacks/MenuThreadDetailStacks';
import { MessagesStacks } from './stacks/MessagesStacks';
import { NotificationStacks } from './stacks/NotificationStacks';
import { ServersStacks } from './stacks/ServersStacks';
import { SettingStacks } from './stacks/SettingStacks';
const RootStack = createStackNavigator();
const { SharedPreferences } = NativeModules;

export const Authentication = memo(() => {
	const isTabletLandscape = useTabletLandscape();
	const { onchannelmessage } = useContext(ChatContext);

	useEffect(() => {
		initLoader();
		onNotificationOpenedApp();
	}, []);

	const initLoader = async () => {
		try {
			await notifee.cancelAllNotifications();
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		} catch (error) {
			console.error('Error in tasks:', error);
		}
	};

	const onNotificationOpenedApp = async () => {
		if (Platform.OS === 'android') {
			try {
				const notificationDataPushed = await SharedPreferences.getItem('notificationDataPushed');
				const notificationDataPushedParse = safeJSONParse(notificationDataPushed || '[]');
				if (notificationDataPushedParse.length > 0) {
					for (const data of notificationDataPushedParse) {
						const extraMessage = data?.message;
						if (extraMessage) {
							const message = safeJSONParse(extraMessage);
							if (message?.channel_id) {
								onchannelmessage(message as ChannelMessage);
							}
						}
					}
					await SharedPreferences.removeItem('notificationDataPushed');
				}
			} catch (error) {
				console.error('Error processing notifications:', error);
			}
		}
	};

	return (
		<BottomSheetModalProvider>
			<RootStack.Navigator
				initialRouteName={APP_SCREEN.BOTTOM_BAR}
				screenOptions={{
					headerShown: false,
					gestureEnabled: Platform.OS === 'ios',
					gestureDirection: 'horizontal',
					animationEnabled: false
				}}
			>
				<RootStack.Screen name={APP_SCREEN.BOTTOM_BAR} component={BottomNavigatorWrapper} />
				<RootStack.Screen
					name={APP_SCREEN.HOME_DEFAULT}
					component={isTabletLandscape ? HomeScreenTablet : HomeDefaultWrapper}
					options={{
						animationEnabled: false,
						headerShown: false,
						gestureEnabled: Platform.OS === 'ios',
						gestureDirection: 'horizontal',
						gestureResponseDistance: Dimensions.get('window').width
					}}
				/>
				<RootStack.Screen
					name={APP_SCREEN.MESSAGES.MESSAGE_DETAIL}
					component={DirectMessageDetailScreen}
					options={{
						animationEnabled: false,
						headerShown: false,
						headerShadowVisible: false,
						gestureEnabled: Platform.OS === 'ios',
						gestureDirection: 'horizontal',
						gestureResponseDistance: Dimensions.get('window').width
					}}
				/>
				<RootStack.Screen name={APP_SCREEN.SERVERS.STACK} children={(props) => <ServersStacks {...props} />} />
				<RootStack.Screen name={APP_SCREEN.MESSAGES.STACK} children={(props) => <MessagesStacks {...props} />} />
				<RootStack.Screen name={APP_SCREEN.NOTIFICATION.STACK} children={(props) => <NotificationStacks {...props} />} />
				<RootStack.Screen name={APP_SCREEN.MENU_CHANNEL.STACK} children={(props) => <MenuChannelStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.MENU_THREAD.STACK} children={(props) => <MenuThreadDetailStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.MENU_CLAN.STACK} children={(props) => <MenuClanStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.SETTINGS.STACK} children={(props) => <SettingStacks {...props} />} />

				<RootStack.Screen name={APP_SCREEN.FRIENDS.STACK} children={(props) => <FriendStacks {...props} />} />
			</RootStack.Navigator>
			<CallingModalWrapper />
			<StreamingWrapper />
			<ChannelVoicePopup />
		</BottomSheetModalProvider>
	);
});
