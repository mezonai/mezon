import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import HomeScreen from './HomeScreen';

const HomeDefaultWrapper = React.memo((props: any) => {
	const { themeValue, themeBasic } = useTheme();

	useFocusEffect(() => {
		const statusBarStyle = themeBasic === ThemeModeBase.LIGHT || themeBasic === ThemeModeBase.SUNRISE ? 'dark-content' : 'light-content';
		if (Platform.OS === 'android') {
			StatusBar.setBackgroundColor(themeValue.primary);
		}
		StatusBar.setBarStyle(statusBarStyle);
	});
	useEffect(() => {
		return () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
		};
	}, [themeValue.secondary]);

	return (
		<>
			<StatusBarHeight />
			<HomeScreen {...props} />
		</>
	);
});

export default HomeDefaultWrapper;
