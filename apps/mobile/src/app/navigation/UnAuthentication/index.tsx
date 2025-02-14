import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useCheckUpdatedVersion } from '../../hooks/useCheckUpdatedVersion';
import LoginScreen from '../../screens/auth/Login';
import RegisterScreen from '../../screens/auth/Register';
import { APP_SCREEN } from '../ScreenTypes';

const Stack = createNativeStackNavigator();

export const UnAuthentication = () => {
	const getInitialRouteName = APP_SCREEN.LOGIN;
	useCheckUpdatedVersion();

	return (
		<Stack.Navigator initialRouteName={getInitialRouteName} screenOptions={{ headerShown: false, gestureEnabled: Platform.OS === 'ios' }}>
			<Stack.Screen name={APP_SCREEN.LOGIN} component={LoginScreen} />
			<Stack.Screen name={APP_SCREEN.REGISTER} component={RegisterScreen} />
		</Stack.Navigator>
	);
};
