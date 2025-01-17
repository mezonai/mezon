import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import { Block, useTheme } from '@mezon/mobile-ui';
import notifee from '@notifee/react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { setTimeout } from '@testing-library/react-native/build/helpers/timers';
import React, { useEffect, useState } from 'react';
import BootSplash from 'react-native-bootsplash';
import HomeDefault from './HomeDefault';

const HomeDefaultWrapper = React.memo((props: any) => {
	const [isReadyForUse, setIsReadyForUse] = useState<boolean>(false);
	const navigation = useNavigation<any>();
	const { themeValue } = useTheme();

	useEffect(() => {
		navigation.dispatch(DrawerActions.openDrawer());
		const timer = setTimeout(async () => {
			await notifee.cancelAllNotifications();
			await remove(STORAGE_CHANNEL_CURRENT_CACHE);
			await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
			await BootSplash.hide({ fade: true });
		}, 1);
		const timer2 = setTimeout(async () => {
			setIsReadyForUse(true);
		}, 2000);
		return () => {
			clearTimeout(timer);
			clearTimeout(timer2);
		};
	}, []);

	if (!isReadyForUse) {
		return <Block flex={1} backgroundColor={themeValue.primary} />;
	}

	return <HomeDefault {...props} />;
});

export default HomeDefaultWrapper;
