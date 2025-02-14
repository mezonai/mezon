import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { SettingIcon } from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text } from 'react-native';
import { FriendScreen } from '../../../screens/friend';
import { AddFriendScreen } from '../../../screens/friend/AddFriend';
import { RequestFriendScreen } from '../../../screens/friend/RequestFriend';
import { SettingFriendRequestScreen } from '../../../screens/friend/SettingFriendRequest';
import { APP_SCREEN } from '../../ScreenTypes';

const AddFriendButton = ({ navigation }: { navigation: any }) => {
	const { t } = useTranslation(['screen']);
	return (
		<Pressable
			onPress={() => navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.ADD_FRIEND })}
			style={{ marginRight: size.s_18 }}
		>
			<Text style={{ color: Colors.textViolet }}>{t('headerRight.addFriends')}</Text>
		</Pressable>
	);
};

const SettingFriendRequestButton = ({ navigation }: { navigation: any }) => {
	const { t } = useTranslation(['screen']);
	const { themeValue } = useTheme();
	return (
		<Pressable
			onPress={() => navigation.navigate(APP_SCREEN.FRIENDS.STACK, { screen: APP_SCREEN.FRIENDS.REQUEST_FRIEND_SETTING })}
			style={{ marginRight: size.s_18 }}
		>
			<SettingIcon height={20} width={20} color={themeValue.text} />
		</Pressable>
	);
};

// eslint-disable-next-line no-empty-pattern
export const FriendStacks = ({ navigation }: { navigation: any }) => {
	const Stack = createStackNavigator();
	const { themeValue } = useTheme();
	const { t } = useTranslation(['screen']);
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: true,
				headerShadowVisible: false,
				gestureEnabled: Platform.OS === 'ios',
				gestureDirection: 'horizontal',
				headerTitleAlign: 'center',
				headerStyle: {
					backgroundColor: themeValue.secondary
				},
				headerTitleStyle: {
					color: themeValue.textStrong
				},
				cardStyle: {
					backgroundColor: 'transparent'
				},
				headerLeftContainerStyle: Platform.select({
					ios: {
						left: size.s_6
					}
				}),
				headerTintColor: themeValue.text,
				headerLeftLabelVisible: false,
				animationEnabled: Platform.OS === 'ios'
			}}
		>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.HOME}
				component={FriendScreen}
				options={{
					headerTitle: t('headerTitle.Friends'),
					headerRight: () => <AddFriendButton navigation={navigation} />
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.ADD_FRIEND}
				component={AddFriendScreen}
				options={{
					headerTitle: t('headerTitle.addFriends')
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.REQUEST_FRIEND}
				component={RequestFriendScreen}
				options={{
					headerTitle: t('headerTitle.requestFriend'),
					headerRight: () => <SettingFriendRequestButton navigation={navigation} />
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.REQUEST_FRIEND_SETTING}
				component={SettingFriendRequestScreen}
				options={{
					headerTitle: t('headerTitle.friendRequestSettings')
				}}
			/>
		</Stack.Navigator>
	);
};
