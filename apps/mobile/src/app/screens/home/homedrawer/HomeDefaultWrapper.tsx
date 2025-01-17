import {
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	load,
	remove
} from '@mezon/mobile-components';
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
		let timer2;
		requestIdleCallback(() => {
			const isDisableLoad = load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			const isFromFCM = isDisableLoad?.toString() === 'true';

			timer2 = setTimeout(
				async () => {
					setIsReadyForUse(true);
				},
				isFromFCM ? 1 : 2000
			);
		});

		return () => {
			clearTimeout(timer);
			timer2 && clearTimeout(timer2);
		};
	}, []);

	if (!isReadyForUse) {
		return <Block flex={1} backgroundColor={themeValue.primary} />;
	}

	return <HomeDefault {...props} />;
});

export default HomeDefaultWrapper;
