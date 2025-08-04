import React, { memo } from 'react';

import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import { Dimensions, Platform, View } from 'react-native';
import CallingModalGroupWrapper from '../../components/CallingModalGroupWrapper';
import CallingModalWrapper from '../../components/CallingModalWrapper';
import HomeScreenTablet from '../../screens/home/HomeScreenTablet';
import ChannelAppScreen from '../../screens/home/homedrawer/ChannelApp';
import HomeDefaultWrapper from '../../screens/home/homedrawer/HomeDefaultWrapper';
import ChannelRouterListener from '../../screens/home/homedrawer/components/ChannelList/ChannelRouterListener';
import { RenderVideoDetail } from '../../screens/home/homedrawer/components/RenderVideoDetail';
import { DirectMessageDetailScreen } from '../../screens/messages/DirectMessageDetail';
import { WalletScreen } from '../../screens/wallet';
import { APP_SCREEN } from '../ScreenTypes';
import { AuthenticationLoader } from './AuthenticationLoader';
import BottomNavigatorWrapper from './BottomNavigatorWrapper';
import { FCMNotificationLoader } from './FCMNotificationLoader';
import { ListenerLoader } from './ListenerLoader';
import { FriendStacks } from './stacks/FriendStacks';
import { MenuChannelStacks } from './stacks/MenuChannelStack';
import { MenuClanStacks } from './stacks/MenuSererStack';
import { MenuThreadDetailStacks } from './stacks/MenuThreadDetailStacks';
import { MessagesStacks } from './stacks/MessagesStacks';
import { NotificationStacks } from './stacks/NotificationStacks';
import { ServersStacks } from './stacks/ServersStacks';
import { SettingStacks } from './stacks/SettingStacks';
import { ShopStack } from './stacks/ShopStack';
const RootStack = createStackNavigator();

export const RootAuthStack = memo(
	({ isTabletLandscape, notifyInit, initRouteName }: { isTabletLandscape: boolean; notifyInit: any; initRouteName: string }) => {
		return (
			<View style={{ flex: 1 }}>
				<RootStack.Navigator
					initialRouteName={APP_SCREEN.BOTTOM_BAR}
					screenOptions={{
						headerShown: false,
						gestureEnabled: Platform.OS === 'ios',
						gestureDirection: 'horizontal'
					}}
				>
					<RootStack.Screen
						name={APP_SCREEN.BOTTOM_BAR}
						children={(props) => <BottomNavigatorWrapper {...props} initRouteName={initRouteName} />}
					/>
					<RootStack.Screen
						name={APP_SCREEN.HOME_DEFAULT}
						component={isTabletLandscape ? HomeScreenTablet : HomeDefaultWrapper}
						options={{
							animationEnabled: Platform.OS === 'ios',
							headerShown: false,
							gestureEnabled: true,
							gestureDirection: 'horizontal',
							gestureResponseDistance: Dimensions.get('window').width,
							cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
							transitionSpec: {
								open: {
									animation: 'timing',
									config: {
										duration: 200
									}
								},
								close: {
									animation: 'timing',
									config: {
										duration: 200
									}
								}
							},
							keyboardHandlingEnabled: false
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
							cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
							keyboardHandlingEnabled: false,
							transitionSpec: {
								open: {
									animation: 'timing',
									config: {
										duration: 200
									}
								},
								close: {
									animation: 'timing',
									config: {
										duration: 200
									}
								}
							}
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
					<RootStack.Screen name={APP_SCREEN.SHOP.STACK} children={(props) => <ShopStack {...props} />} />
				</RootStack.Navigator>
				<FCMNotificationLoader notifyInit={notifyInit} />
				<AuthenticationLoader />
				<CallingModalWrapper />
				<CallingModalGroupWrapper />
				<ChannelRouterListener />
				<ListenerLoader />
			</View>
		);
	}
);
