import { CardStyleInterpolators, createStackNavigator, TransitionSpecs } from '@react-navigation/stack';
import React from 'react';

import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { ChatBoxStreamComponent } from '../../../screens/home/homedrawer/components/StreamingRoom/ChatBoxStream';
import { DirectMessageDetailScreen } from '../../../screens/messages/DirectMessageDetail';
import { NewGroupScreen } from '../../../screens/messages/NewGroup';
import { NewMessageScreen } from '../../../screens/messages/NewMessage';
import { APP_SCREEN } from '../../ScreenTypes';

// eslint-disable-next-line no-empty-pattern
export const MessagesStacks = ({}: any) => {
	const Stack = createStackNavigator();
	const { themeValue } = useTheme();
	const { t } = useTranslation('screen');
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: true,
				headerShadowVisible: true,
				gestureEnabled: true,
				gestureDirection: 'vertical',
				transitionSpec: {
					open: TransitionSpecs.TransitionIOSSpec,
					close: TransitionSpecs.TransitionIOSSpec
				},
				cardStyle: { backgroundColor: themeValue.secondary },
				cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
				headerTitleAlign: 'center',
				headerTintColor: themeValue.text,
				headerStyle: {
					backgroundColor: themeValue.secondary
				},
				headerLeftContainerStyle: Platform.select({
					ios: {
						left: size.s_6
					}
				}),
				headerLeftLabelVisible: false
			}}
		>
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.MESSAGE_DETAIL}
				component={DirectMessageDetailScreen}
				options={{
					headerShown: false,
					headerShadowVisible: false
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.NEW_MESSAGE}
				component={NewMessageScreen}
				options={{
					headerTitle: t('headerTitle.newMessage')
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.NEW_GROUP}
				component={NewGroupScreen}
				options={{
					headerShown: false
				}}
			/>

			<Stack.Screen
				name={APP_SCREEN.MESSAGES.CHAT_STREAMING}
				component={ChatBoxStreamComponent}
				options={{
					title: t('headerTitle.chat')
				}}
			/>
		</Stack.Navigator>
	);
};
