import { CardStyleInterpolators, createStackNavigator, TransitionSpecs } from '@react-navigation/stack';
import React from 'react';

import { size, useTheme } from '@mezon/mobile-ui';
import { Platform } from 'react-native';
import Notifications from '../../../screens/Notifications';
import { APP_SCREEN } from '../../ScreenTypes';

// eslint-disable-next-line no-empty-pattern
export const NotificationStacks = ({}: any) => {
	const Stack = createStackNavigator();
	const { themeValue } = useTheme();
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				headerShadowVisible: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				transitionSpec: {
					open: TransitionSpecs.TransitionIOSSpec,
					close: TransitionSpecs.TransitionIOSSpec
				},
				headerLeftContainerStyle: Platform.select({
					ios: {
						left: size.s_6
					}
				}),
				cardStyle: { backgroundColor: themeValue.secondary },
				cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
			}}
			initialRouteName={APP_SCREEN.NOTIFICATION.HOME}
		>
			<Stack.Screen
				name={APP_SCREEN.NOTIFICATION.HOME}
				component={Notifications}
				// component={ListIconScreens}
				options={{
					headerShown: false
				}}
			/>
			{/* <Stack.Screen
				name={APP_SCREEN.NOTIFICATION.DETAIL}
				component={NotificationsDetail}
				// component={ListIconScreens}
				options={{
					headerShown: false,
				}}
			/> */}
		</Stack.Navigator>
	);
};
