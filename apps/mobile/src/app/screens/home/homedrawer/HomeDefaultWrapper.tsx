import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { sleep } from '@mezon/utils';
import notifee from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import {Platform, StatusBar, View} from 'react-native';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import HomeDefault from './HomeDefault';
import SwipeBackContainer from './SwipeBackContainer';

const HomeDefaultWrapper = React.memo((props: any) => {
	const { themeValue, themeBasic } = useTheme();
	const navigation = useNavigation<any>();
	useEffect(() => {
		initLoader();
	}, []);

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

	const initLoader = async () => {
		try {
			await sleep(1);
			await notifee.cancelAllNotifications();
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		} catch (error) {
			console.error('Error in tasks:', error);
		}
	};

	const handleBack = useCallback(() => {
		navigation.goBack();
	}, []);

	return (
		<SwipeBackContainer handleBack={handleBack}>
			<StatusBarHeight />
			<HomeDefault {...props} />
		</SwipeBackContainer>
	);
});

export default HomeDefaultWrapper;
