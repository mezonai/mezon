import React, { memo } from 'react';

import { registerGlobals } from '@livekit/react-native';
import type { StackCardInterpolatedStyle, StackCardInterpolationProps, StackCardStyleInterpolator } from '@react-navigation/stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Dimensions, Platform, View } from 'react-native';
import CallingModalGroupWrapper from '../../components/CallingModalGroupWrapper';
import CallingModalWrapper from '../../components/CallingModalWrapper';
import ModalRootListener from '../../components/ModalRootListener';
import AppBrowser from '../../screens/auth/AppBrowser';
import HomeScreenTablet from '../../screens/home/HomeScreenTablet';
import ChannelAppScreen from '../../screens/home/homedrawer/ChannelApp';
import HomeDefaultWrapper from '../../screens/home/homedrawer/HomeDefaultWrapper';
import ChannelRouterListener from '../../screens/home/homedrawer/components/ChannelList/ChannelRouterListener';
import RemoveNotificationListener from '../../screens/home/homedrawer/components/ChannelList/RemoveNotificationListener';
import InstallClanScreen from '../../screens/installClan/InstallClanScreen';
import InviteClanScreen from '../../screens/inviteClan/InviteClanScreen';
import { DirectMessageDetailScreen } from '../../screens/messages/DirectMessageDetail';
import { ProfileDetail } from '../../screens/profile/ProfileDetail';
import { WalletScreen } from '../../screens/wallet';
import { APP_SCREEN } from '../ScreenTypes';
import { AuthenticationLoader } from './AuthenticationLoader';
import { BadgeAppIconLoader } from './BadgeAppIconLoader';
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
import { styles } from './styles';

const RootStack = createStackNavigator();
registerGlobals();

export const RootAuthStack = memo(
	({ isTabletLandscape, notifyInit, initRouteName }: { isTabletLandscape: boolean; notifyInit: any; initRouteName: string }) => {
		const customCardStyleInterpolator: StackCardStyleInterpolator = (props: StackCardInterpolationProps): StackCardInterpolatedStyle => {
			const { current, layouts } = props;
			return {
				cardStyle: {
					transform: [
						{
							translateX: current.progress.interpolate({
								inputRange: [0, 1],
								outputRange: [layouts.screen.width, 0],
								extrapolate: 'clamp'
							})
						}
					]
				},
				overlayStyle: {
					opacity: current.progress.interpolate({
						inputRange: [0, 1],
						outputRange: [0, 0.5]
					})
				}
			};
		};

		return (
			<View style={styles.flexContainer}>
				<RootStack.Navigator
					initialRouteName={APP_SCREEN.BOTTOM_BAR}
					screenOptions={{
						headerShown: false,
						animationEnabled: false,
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
							cardStyleInterpolator: customCardStyleInterpolator,
							transitionSpec: {
								open: {
									animation: 'timing',
									config: {
										duration: 150
									}
								},
								close: {
									animation: 'timing',
									config: {
										duration: 100
									}
								}
							},
							keyboardHandlingEnabled: false,
							detachPreviousScreen: false
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
							cardStyleInterpolator: customCardStyleInterpolator,
							keyboardHandlingEnabled: false,
							detachPreviousScreen: false,
							transitionSpec: {
								open: {
									animation: 'timing',
									config: {
										duration: 150
									}
								},
								close: {
									animation: 'timing',
									config: {
										duration: 100
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
					<RootStack.Screen name={APP_SCREEN.CHANNEL_APP} component={ChannelAppScreen} />
					<RootStack.Screen name={APP_SCREEN.APP_BROWSER} component={AppBrowser} />
					<RootStack.Screen name={APP_SCREEN.WALLET} component={WalletScreen} />
					<RootStack.Screen
						name={APP_SCREEN.PROFILE_DETAIL}
						component={ProfileDetail}
						options={{
							headerShown: false,
							gestureEnabled: true,
							gestureDirection: 'horizontal'
						}}
					/>
					<RootStack.Screen name={APP_SCREEN.SHOP.STACK} children={(props) => <ShopStack {...props} />} />
					<RootStack.Screen name={APP_SCREEN.INVITE_CLAN} component={InviteClanScreen} />
					<RootStack.Screen name={APP_SCREEN.INSTALL_CLAN} component={InstallClanScreen} />
				</RootStack.Navigator>
				<ModalRootListener />
				<FCMNotificationLoader notifyInit={notifyInit} />
				<AuthenticationLoader />
				<CallingModalWrapper />
				<CallingModalGroupWrapper />
				<ChannelRouterListener />
				<ListenerLoader />
				<BadgeAppIconLoader />
				<RemoveNotificationListener />
			</View>
		);
	}
);
