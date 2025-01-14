import React, { useEffect } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';
import { useCheckUpdatedVersion } from '../../hooks/useCheckUpdatedVersion';
import LoginScreen from '../../screens/auth/Login';
import RegisterScreen from '../../screens/auth/Register';
import { APP_SCREEN } from '../ScreenTypes';

const Stack = createNativeStackNavigator();

export const UnAuthentication = () => {
	const getInitialRouteName = APP_SCREEN.LOGIN;
	useCheckUpdatedVersion();
	useEffect(() => {
		BootSplash.hide({ fade: true });
	}, []);
	return (
		<Stack.Navigator initialRouteName={getInitialRouteName} screenOptions={{ headerShown: false, gestureEnabled: true }}>
			<Stack.Screen name={APP_SCREEN.LOGIN} component={LoginScreen} />
			<Stack.Screen name={APP_SCREEN.REGISTER} component={RegisterScreen} />
		</Stack.Navigator>
	);
};
