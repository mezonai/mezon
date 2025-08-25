import { size, useTheme } from '@mezon/mobile-ui';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
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
			<Text style={{ color: '#5a62f4' }}>{t('headerRight.addFriends')}</Text>
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
					backgroundColor: themeValue.primary
				},
				headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
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
					headerStyle: {
						backgroundColor: themeValue.primary
					},
					headerRight: () => <AddFriendButton navigation={navigation} />
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.ADD_FRIEND}
				component={AddFriendScreen}
				options={{
					headerTitle: t('headerTitle.addFriends'),
					headerStyle: {
						backgroundColor: themeValue.primary
					}
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.REQUEST_FRIEND}
				component={RequestFriendScreen}
				options={{
					headerTitle: t('headerTitle.requestFriend'),
					headerStyle: {
						backgroundColor: themeValue.primary
					}
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.FRIENDS.REQUEST_FRIEND_SETTING}
				component={SettingFriendRequestScreen}
				options={{
					headerTitle: t('headerTitle.friendRequestSettings'),
					headerStyle: {
						backgroundColor: themeValue.primary
					}
				}}
			/>
		</Stack.Navigator>
	);
};
