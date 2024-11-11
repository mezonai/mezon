/* eslint-disable no-console */
import { MezonStoreProvider, initStore } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { NavigationContainer } from '@react-navigation/native';
import React, { memo, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChatContextProvider } from '@mezon/core';
import { sleep } from '@mezon/utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_KEY_TEMPORARY_ATTACHMENT, remove } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import notifee from '@notifee/react-native';
import { Platform, StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import codePush from 'react-native-code-push';
import Toast from 'react-native-toast-message';
import VersionInfo from 'react-native-version-info';
import MezonUpdateVersionModal from '../componentUI/MezonUpdateVersionModal';
import NetInfoComp from '../components/NetworkInfo';
import { toastConfig } from '../configs/toastConfig';
import RootListener from './RootListener';
import RootStack from './RootStack';

const NavigationMain = memo(
	() => {
		const [isReadyForUse, setIsReadyForUse] = useState<boolean>(false);
		const [isShowUpdateModal, setIsShowUpdateModal] = React.useState<boolean>(false);

		useEffect(() => {
			const timer = setTimeout(() => {
				checkForUpdate();
			}, 2000);
			return () => clearTimeout(timer);
		}, []);

		useEffect(() => {
			const timer = setTimeout(async () => {
				setIsReadyForUse(true);
				await notifee.cancelAllNotifications();
				await remove(STORAGE_CHANNEL_CURRENT_CACHE);
				await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
				await sleep(100);
				await BootSplash.hide({ fade: true });
			}, 200);
			return () => {
				clearTimeout(timer);
			};
		}, []);

		const checkForUpdate = async () => {
			const update = await codePush.checkForUpdate(
				Platform.OS === 'ios' ? process.env.NX_CODE_PUSH_KEY_IOS_MOBILE : (process.env.NX_CODE_PUSH_KEY_ANDROID_MOBILE as string)
			);
			if (VersionInfo.appVersion === update?.appVersion) {
				setIsShowUpdateModal(true);
			}
		};
		return (
			<NavigationContainer>
				<NetInfoComp />
				<RootListener />
				{isReadyForUse && <MezonUpdateVersionModal visible={isShowUpdateModal} onClose={() => setIsShowUpdateModal(false)} />}
				{isReadyForUse && <RootStack />}
			</NavigationContainer>
		);
	},
	() => true
);

const CustomStatusBar = () => {
	const { themeValue, themeBasic } = useTheme();
	// eslint-disable-next-line eqeqeq
	return (
		<StatusBar animated backgroundColor={themeValue.secondary} barStyle={themeBasic == ThemeModeBase.DARK ? 'light-content' : 'dark-content'} />
	);
};

const RootNavigation = () => {
	const mezon = useMezon();
	const { store, persistor } = useMemo(() => {
		if (!mezon) {
			return { store: null, persistor: null };
		}
		return initStore(mezon, undefined);
	}, [mezon]);

	return (
		<MezonStoreProvider store={store} loading={null} persistor={persistor}>
			<CustomStatusBar />
			<ChatContextProvider>
				<NavigationMain />
			</ChatContextProvider>
			<Toast config={toastConfig} />
		</MezonStoreProvider>
	);
};

export default RootNavigation;
