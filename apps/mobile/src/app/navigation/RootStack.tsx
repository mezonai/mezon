import { useTheme } from '@mezon/mobile-ui';
import { selectIsLogin } from '@mezon/store-mobile';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { useSelector } from 'react-redux';
import IncomingHomeScreen from '../screens/customIncomingCall/IncomingHomeScreen';
import { Authentication } from './Authentication';
import { APP_SCREEN } from './ScreenTypes';
import { UnAuthentication } from './UnAuthentication';

const Root = createStackNavigator();

const RootStack = (props) => {
	const isLoggedIn = useSelector(selectIsLogin);
	const { themeValue } = useTheme();

	if (props?.payload && isLoggedIn && Platform.OS === 'android') return <IncomingHomeScreen {...props} />;
	return (
		<Root.Navigator
			screenOptions={{
				headerShown: false,
				cardStyle: { backgroundColor: themeValue.primary }
			}}
		>
			{isLoggedIn ? (
				<Root.Group>
					<Root.Screen name={APP_SCREEN.AUTHORIZE} component={Authentication} />
				</Root.Group>
			) : (
				<Root.Group>
					<Root.Screen name={APP_SCREEN.UN_AUTHORIZE} component={UnAuthentication} />
				</Root.Group>
			)}
		</Root.Navigator>
	);
};

export default RootStack;
