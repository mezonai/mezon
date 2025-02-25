import { HomeTab, MessageTab, NotiTab, ProfileTab } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { memo } from 'react';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import Notifications from '../../screens/Notifications';
import HomeScreenTablet from '../../screens/home/HomeScreenTablet';
import MessagesScreen from '../../screens/messages/MessagesScreen';
import MessagesScreenTablet from '../../screens/messages/MessagesScreenTablet';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import { APP_SCREEN } from '../ScreenTypes';

const TabStack = createBottomTabNavigator();

const BottomNavigator = memo(({ isLastActiveTabDm = false }: { isLastActiveTabDm: boolean }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();

	return (
		<TabStack.Navigator
			screenOptions={{
				tabBarHideOnKeyboard: true,
				tabBarStyle: {
					position: 'absolute',
					zIndex: isTabletLandscape ? -1 : 100,
					height: isTabletLandscape ? 0 : size.s_80,
					paddingHorizontal: 0,
					paddingBottom: size.s_20,
					borderTopWidth: 1,
					elevation: 0,
					backgroundColor: themeValue.secondary,
					borderTopColor: themeValue.border
				},
				tabBarActiveTintColor: themeValue.textStrong,
				tabBarInactiveTintColor: themeValue.textDisabled
			}}
			initialRouteName={isLastActiveTabDm ? APP_SCREEN.MESSAGES.HOME : APP_SCREEN.HOME}
		>
			<TabStack.Screen
				name={APP_SCREEN.HOME}
				component={HomeScreenTablet}
				options={{
					headerShown: false,
					title: 'Clans',
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <HomeTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
			<TabStack.Screen
				name={APP_SCREEN.MESSAGES.HOME}
				component={isTabletLandscape ? MessagesScreenTablet : MessagesScreen}
				options={{
					headerShown: false,
					title: 'Messages',
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <MessageTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
			<TabStack.Screen
				name={APP_SCREEN.NOTIFICATION.HOME}
				component={Notifications}
				options={{
					headerShown: false,
					title: 'Notifications',
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <NotiTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
			<TabStack.Screen
				name={APP_SCREEN.PROFILE.HOME}
				component={ProfileScreen}
				options={{
					headerShown: false,
					title: 'Profile',
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <ProfileTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
		</TabStack.Navigator>
	);
});

export default BottomNavigator;
