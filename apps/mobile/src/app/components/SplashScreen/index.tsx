import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { View } from 'react-native';

const SplashScreen = () => {
	const { themeValue } = useTheme();

	return <View style={{ backgroundColor: themeValue.secondary }} />;
};

export default SplashScreen;
