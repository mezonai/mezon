import React, { memo, useContext, useEffect } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ChatContext } from '@mezon/core';
import { ActionEmitEvent, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import { ColorRoleProvider } from '@mezon/mobile-ui';
import notifee from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import { ChannelMessage, safeJSONParse } from 'mezon-js';
import moment from 'moment';
import { DeviceEventEmitter, Dimensions, Linking, Platform } from 'react-native';
import BottomSheetRootListener from '../../components/BottomSheetRootListener';
import CallingModalGroupWrapper from '../../components/CallingModalGroupWrapper';
import CallingModalWrapper from '../../components/CallingModalWrapper';
import ModalRootListener from '../../components/ModalRootListener';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import HomeScreenTablet from '../../screens/home/HomeScreenTablet';
import ChannelAppScreen from '../../screens/home/homedrawer/ChannelApp';
import ChannelMessageListener from '../../screens/home/homedrawer/ChannelMessageListener';
import ChannelMessageReactionListener from '../../screens/home/homedrawer/ChannelMessageReactionListener';
import HomeDefaultWrapper from '../../screens/home/homedrawer/HomeDefaultWrapper';
import ChannelVoicePopup from '../../screens/home/homedrawer/components/ChannelVoicePopup';
import { RenderVideoDetail } from '../../screens/home/homedrawer/components/RenderVideoDetail';
import StreamingWrapper from '../../screens/home/homedrawer/components/StreamingWrapper';
import { DirectMessageDetailScreen } from '../../screens/messages/DirectMessageDetail';
import { WalletScreen } from '../../screens/wallet';
import NotificationPreferences from '../../utils/NotificationPreferences';
import { APP_SCREEN } from '../ScreenTypes';
import { AuthenticationLoader } from './AuthenticationLoader';
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

export const Authentication = memo(() => {
	const isTabletLandscape = useTabletLandscape();
	const { onchannelmessage } = useContext(ChatContext);
	const navigation = useNavigation<any>();

	useEffect(() => {
		const getUrl = async () => {
			try {
				const url = await Linking.getInitialURL();
				if (url) {
					await onNavigationDeeplink(url);
				}
			} catch (error) {
				console.error('Error getting initial URL:', error);
			}
		};
		getUrl();
	}, []);

	useEffect(() => {
		const eventDeelink = DeviceEventEmitter.addListener(ActionEmitEvent.ON_NAVIGATION_DEEPLINK, (path) => onNavigationDeeplink(path));
		return () => {
			eventDeelink.remove();
		};
	}, []);

	useEffect(() => {
		initLoader();
		onNotificationOpenedApp();
	}, []);

	const deleteAllChannelGroupsNotifee = async () => {
		try {
			const channelGroups = await notifee.getChannelGroups(); // Fetch all channel groups
			for (const group of channelGroups) {
				await notifee.deleteChannelGroup(group.id); // Delete each channel group by its ID
			}
		} catch (error) {
			console.error('Error deleting channel groups:', error);
		}
	};

	const initLoader = async () => {
		try {
			await notifee.cancelAllNotifications();
			if (Platform.OS === 'android') {
				await deleteAllChannelGroupsNotifee();
			}
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		} catch (error) {
			console.error('Error in tasks:', error);
		}
	};

	const extractChannelParams = (url: string) => {
		const regex = /channel-app\/(\d+)\/(\d+)(?:\?[^#]*)?/;
		const baseMatch = url.match(regex);
		if (!baseMatch) return null;

		const [, id1, id2] = baseMatch;

		const codeMatch = url.match(/[?&]code=([^&]+)/);
		const subpathMatch = url.match(/[?&]subpath=([^&]+)/);

		return {
			channelId: id1,
			clanId: id2,
			code: codeMatch ? codeMatch[1] : null,
			subpath: subpathMatch ? subpathMatch[1] : null
		};
	};

	const onNavigationDeeplink = async (path: string) => {
		if (path?.includes?.('channel-app/')) {
			const parts = extractChannelParams(path);
			const channelId = parts?.channelId;
			const clanId = parts?.clanId;
			const code = parts?.code;
			const subpath = parts?.subpath;
			if (clanId && channelId) {
				navigation.navigate(APP_SCREEN.CHANNEL_APP, {
					channelId: channelId,
					clanId: clanId,
					code: code,
					subpath: subpath
				});
			}
		}
	};
	const onNotificationOpenedApp = async () => {
		if (Platform.OS === 'android') {
			try {
				const notificationDataPushed = await NotificationPreferences.getValue('notificationDataPushed');
				const notificationDataPushedParse = safeJSONParse(notificationDataPushed || '[]');
				if (notificationDataPushedParse.length > 0) {
					for (const data of notificationDataPushedParse) {
						const extraMessage = data?.message;
						if (extraMessage) {
							const message = safeJSONParse(extraMessage);
							if (message?.channel_id) {
								const createTime = moment.unix(message?.create_time_seconds).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
								const updateTime = moment.unix(message?.update_time_seconds).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
								const messageData = {
									...message,
									code: message?.code?.value || 0,
									id: message.message_id,
									content: safeJSONParse(message.content),
									attachments: safeJSONParse(message.attachments),
									mentions: safeJSONParse(message.mentions),
									references: safeJSONParse(message.references),
									reactions: safeJSONParse(message.reactions),
									create_time: createTime,
									update_time: updateTime
								};
								onchannelmessage(messageData as ChannelMessage);
							}
						}
					}
				}
				await NotificationPreferences.clearValue('notificationDataPushed');
			} catch (error) {
				console.error('Error processing notifications:', error);
			}
		}
	};

	return (
		<BottomSheetModalProvider>
			<ColorRoleProvider>
				<RootStack.Navigator
					initialRouteName={APP_SCREEN.BOTTOM_BAR}
					screenOptions={{
						headerShown: false,
						gestureEnabled: Platform.OS === 'ios',
						gestureDirection: 'horizontal'
					}}
				>
					<RootStack.Screen name={APP_SCREEN.BOTTOM_BAR} component={BottomNavigatorWrapper} />
					<RootStack.Screen
						name={APP_SCREEN.HOME_DEFAULT}
						component={isTabletLandscape ? HomeScreenTablet : HomeDefaultWrapper}
						options={{
							animationEnabled: Platform.OS === 'ios',
							headerShown: false,
							gestureEnabled: true,
							gestureDirection: 'horizontal',
							gestureResponseDistance: Dimensions.get('window').width,
							cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
						}}
					/>
					<RootStack.Screen
						name={APP_SCREEN.MESSAGES.MESSAGE_DETAIL}
						component={DirectMessageDetailScreen}
						options={{
							animationEnabled: Platform.OS === 'ios',
							headerShown: false,
							headerShadowVisible: false,
							gestureEnabled: true,
							gestureDirection: 'horizontal',
							gestureResponseDistance: Dimensions.get('window').width,
							cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
						}}
					/>
					<RootStack.Screen name={APP_SCREEN.SERVERS.STACK} children={(props) => <ServersStacks {...props} />} />
					<RootStack.Screen
						name={APP_SCREEN.MESSAGES.STACK}
						children={(props) => <MessagesStacks {...props} />}
						options={{
							animationEnabled: Platform.OS === 'ios'
						}}
					/>
					<RootStack.Screen name={APP_SCREEN.NOTIFICATION.STACK} children={(props) => <NotificationStacks {...props} />} />
					<RootStack.Screen name={APP_SCREEN.MENU_CHANNEL.STACK} children={(props) => <MenuChannelStacks {...props} />} />

					<RootStack.Screen name={APP_SCREEN.MENU_THREAD.STACK} children={(props) => <MenuThreadDetailStacks {...props} />} />

					<RootStack.Screen name={APP_SCREEN.MENU_CLAN.STACK} children={(props) => <MenuClanStacks {...props} />} />

					<RootStack.Screen name={APP_SCREEN.SETTINGS.STACK} children={(props) => <SettingStacks {...props} />} />

					<RootStack.Screen
						name={APP_SCREEN.FRIENDS.STACK}
						children={(props) => <FriendStacks {...props} />}
						options={{
							animationEnabled: Platform.OS === 'ios'
						}}
					/>

					<RootStack.Screen
						name={APP_SCREEN.VIDEO_DETAIL}
						component={RenderVideoDetail}
						options={{
							headerShown: false,
							headerShadowVisible: false
						}}
					/>
					<RootStack.Screen name={APP_SCREEN.CHANNEL_APP} component={ChannelAppScreen} />
					<RootStack.Screen name={APP_SCREEN.WALLET} component={WalletScreen} />
				</RootStack.Navigator>
				<CallingModalWrapper />
				<CallingModalGroupWrapper />
				<StreamingWrapper />
				<ChannelVoicePopup />
				<BottomSheetRootListener />
				<ModalRootListener />
				<ChannelMessageListener />
				<ChannelMessageReactionListener />
				<AuthenticationLoader />
			</ColorRoleProvider>
		</BottomSheetModalProvider>
	);
});
