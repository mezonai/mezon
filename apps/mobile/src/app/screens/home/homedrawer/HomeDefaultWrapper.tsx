import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import HomeScreen from './HomeScreen';

const HomeDefaultWrapper = React.memo((props: any) => {
	const { themeValue, themeBasic } = useTheme();
	const navigation = useNavigation<any>();

	useEffect(() => {
		const statusBarStyle = themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content';

		if (Platform.OS === 'android') {
			StatusBar.setBackgroundColor(themeValue.primary);
		}
		StatusBar.setBarStyle(statusBarStyle);
		return () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
		};
	}, [themeBasic, themeValue.primary, themeValue.secondary]);

	const handleBack = useCallback(() => {
		navigation.goBack();
	}, []);

	return (
		<>
			<StatusBarHeight />
			<HomeScreen {...props} />
		</>
	);
});

export default HomeDefaultWrapper;
