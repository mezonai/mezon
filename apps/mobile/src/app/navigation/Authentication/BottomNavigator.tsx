import { HomeTab, MessageTab, NotiTab, ProfileTab } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectHiddenBottomTabMobile, useAppSelector } from '@mezon/store-mobile';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
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
	const isHiddenTab = useAppSelector(selectHiddenBottomTabMobile);
	const { themeValue } = useTheme();
	const { t } = useTranslation(['screen']);

	return (
		<TabStack.Navigator
			screenOptions={{
				tabBarHideOnKeyboard: true,
				tabBarStyle: {
					position: 'absolute',
					zIndex: isTabletLandscape ? -1 : 100,
					height: isTabletLandscape ? 0 : size.s_80 - (isHiddenTab && Platform.OS === 'android' ? size.s_20 : size.s_2),
					paddingHorizontal: 0,
					paddingBottom: isHiddenTab && Platform.OS === 'android' ? size.s_2 : size.s_20,
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
					title: t('navigationTabs.messages'),
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <MessageTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
			<TabStack.Screen
				name={APP_SCREEN.NOTIFICATION.HOME}
				component={Notifications}
				options={{
					headerShown: false,
					title: t('navigationTabs.notifications'),
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <NotiTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
			<TabStack.Screen
				name={APP_SCREEN.PROFILE.HOME}
				component={ProfileScreen}
				options={{
					headerShown: false,
					title: t('navigationTabs.profile'),
					tabBarLabelStyle: { fontWeight: '600', top: -size.s_2 },
					tabBarIcon: ({ color }) => <ProfileTab color={color} width={size.s_22} height={size.s_22} />
				}}
			/>
		</TabStack.Navigator>
	);
});

export default BottomNavigator;
