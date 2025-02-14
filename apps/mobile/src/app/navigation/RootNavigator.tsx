/* eslint-disable no-console */
import { MezonStoreProvider, initStore } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { NavigationContainer } from '@react-navigation/native';
import React, { memo, useEffect, useMemo } from 'react';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChatContextProvider } from '@mezon/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ThemeModeBase, ThemeProvider, useTheme } from '@mezon/mobile-ui';
import { Platform, StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import codePush from 'react-native-code-push';
import Toast from 'react-native-toast-message';
import VersionInfo from 'react-native-version-info';
import MezonUpdateVersionModal from '../componentUI/MezonUpdateVersionModal';
import NetInfoComp from '../components/NetworkInfo';
import { WebRTCStreamProvider } from '../components/StreamContext/StreamContext';
import { toastConfig } from '../configs/toastConfig';
import RootListener from './RootListener';
import RootStack from './RootStack';

const NavigationMain = memo(
	(props) => {
		const [isShowUpdateModal, setIsShowUpdateModal] = React.useState<boolean>(false);
		const { themeValue, themeBasic } = useTheme();

		useEffect(() => {
			const timer = setTimeout(() => {
				checkForUpdate();
			}, 2000);
			return () => clearTimeout(timer);
		}, []);

		const checkForUpdate = async () => {
			const update = await codePush.checkForUpdate(
				Platform.OS === 'ios' ? process.env.NX_CODE_PUSH_KEY_IOS_MOBILE : (process.env.NX_CODE_PUSH_KEY_ANDROID_MOBILE as string)
			);
			if (update) {
				if (update.failedInstall) {
					/* empty */
				} else if (VersionInfo.appVersion === update.appVersion) {
					setIsShowUpdateModal(true);
				}
			}
		};

		const theme = {
			dark: themeBasic === ThemeModeBase.DARK,
			colors: {
				background: themeValue.primary,
				border: themeValue.primary,
				card: themeValue.primary,
				notification: themeValue.primary,
				primary: themeValue.primary,
				text: themeValue.text
			}
		};

		return (
			<NavigationContainer
				theme={theme}
				onReady={async () => {
					await BootSplash.hide({ fade: true });
				}}
			>
				<NetInfoComp />
				<RootListener />
				<MezonUpdateVersionModal visible={isShowUpdateModal} onClose={() => setIsShowUpdateModal(false)} />
				<RootStack {...props} />
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

const RootNavigation = (props) => {
	const mezon = useMezon();
	const { store, persistor } = useMemo(() => {
		if (!mezon) {
			return { store: null, persistor: null };
		}
		return initStore(mezon, undefined);
	}, [mezon]);

	return (
		<MezonStoreProvider store={store} loading={null} persistor={persistor}>
			<ThemeProvider>
				<CustomStatusBar />
				<ChatContextProvider>
					<WebRTCStreamProvider>
						<NavigationMain {...props} />
					</WebRTCStreamProvider>
				</ChatContextProvider>
				<Toast config={toastConfig} />
			</ThemeProvider>
		</MezonStoreProvider>
	);
};

export default RootNavigation;
