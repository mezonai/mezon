import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { sleep } from '@mezon/utils';
import notifee from '@notifee/react-native';
import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import HomeDefault from './HomeDefault';
import SwipeBackContainer from './SwipeBackContainer';

const HomeDefaultWrapper = React.memo((props: any) => {
	const { themeValue, themeBasic } = useTheme();

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
			await BootSplash.hide({ fade: true });
		} catch (error) {
			console.error('Error in tasks:', error);
		}
	};

	return (
		<SwipeBackContainer>
			<HomeDefault {...props} />
		</SwipeBackContainer>
	);
});

export default HomeDefaultWrapper;
