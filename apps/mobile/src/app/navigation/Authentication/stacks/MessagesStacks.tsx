import { CardStyleInterpolators, createStackNavigator, TransitionSpecs } from '@react-navigation/stack';
import React from 'react';

import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { ChatBoxStreamComponent } from '../../../screens/home/homedrawer/components/StreamingRoom/ChatBoxStream';
import TopicDiscussion from '../../../screens/home/homedrawer/components/TopicDiscussion/TopicDiscussion';
import { ConfirmPinScreen } from '../../../screens/messages/ConfirmSecurePin';
import { CreatePinScreen } from '../../../screens/messages/CreateSecurePin';
import { DirectMessageDetailScreen } from '../../../screens/messages/DirectMessageDetail';
import { E2EEConfirmScreen } from '../../../screens/messages/E2EEConfirmScreen';
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
				headerLeftLabelVisible: false,
				animationEnabled: Platform.OS === 'ios'
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
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.TOPIC_DISCUSSION}
				component={TopicDiscussion}
				options={{
					title: t('headerTitle.topic'),
					headerStyle: {
						backgroundColor: themeValue.primary
					},
					headerShown: false,
					headerShadowVisible: false
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.CREATE_PIN}
				component={CreatePinScreen}
				options={{
					headerTitle: ''
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.CONFIRM_PIN}
				component={ConfirmPinScreen}
				options={{
					headerTitle: ''
				}}
			/>
			<Stack.Screen
				name={APP_SCREEN.MESSAGES.E2EECONFIRM_PIN}
				component={E2EEConfirmScreen}
				options={{
					headerTitle: ''
				}}
			/>
		</Stack.Navigator>
	);
};
