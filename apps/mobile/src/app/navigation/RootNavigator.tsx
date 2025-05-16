/* eslint-disable no-console */
import { MezonStoreProvider, initStore } from '@mezon/store-mobile';
import { extractAndSaveConfig, useMezon } from '@mezon/transport';
import { LinkingOptions, NavigationContainer, getStateFromPath } from '@react-navigation/native';
import React, { memo, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChatContextProvider, EmojiSuggestionProvider, PermissionProvider } from '@mezon/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ActionEmitEvent, STORAGE_SESSION_KEY, save } from '@mezon/mobile-components';
import { ThemeModeBase, ThemeProvider, useTheme } from '@mezon/mobile-ui';
import { Session } from 'mezon-js';
import { DeviceEventEmitter, NativeModules, Platform, StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import NetInfoComp from '../components/NetworkInfo';
import { WebRTCStreamProvider } from '../components/StreamContext/StreamContext';
import { toastConfig } from '../configs/toastConfig';
import { DeviceProvider } from '../contexts/device';
import RootListener from './RootListener';
import RootStack from './RootStack';
import { APP_SCREEN } from './ScreenTypes';
const { NavigationBarModule } = NativeModules;

const saveMezonConfigToStorage = (host: string, port: string, useSSL: boolean) => {
	try {
		save(
			STORAGE_SESSION_KEY,
			JSON.stringify({
				host,
				port,
				ssl: useSSL
			})
		);
	} catch (error) {
		console.error('Failed to save Mezon config to local storage:', error);
	}
};
const NavigationMain = memo(
	(props) => {
		const { themeValue, themeBasic } = useTheme();
		const [isThreeButtonNav, setIsThreeButtonNav] = useState<boolean>(false);

		useEffect(() => {
			const getNavigationInfo = async () => {
				if (Platform.OS === 'android') {
					try {
						const hasThreeButtons = await NavigationBarModule.getNavigationBarStyle();
						setIsThreeButtonNav(hasThreeButtons);
						await NavigationBarModule.setNavigationBarTransparent();
					} catch (error) {
						console.error('Error getting navigation bar info:', error);
					}
				} else {
					// iOS doesn't have the same navigation bar concept
				}
			};

			getNavigationInfo();
		}, []);

		// comment logic check new version on code-push
		// useEffect(() => {
		// 	const timer = setTimeout(() => {
		// 		checkForUpdate();
		// 	}, 2000);
		// 	return () => clearTimeout(timer);
		// }, []);

		// const checkForUpdate = async () => {
		// 	const update = await codePush.checkForUpdate(
		// 		Platform.OS === 'ios' ? process.env.NX_CODE_PUSH_KEY_IOS_MOBILE : (process.env.NX_CODE_PUSH_KEY_ANDROID_MOBILE as string)
		// 	);
		// 	if (update) {
		// 		if (update.failedInstall) {
		// 			/* empty */
		// 		} else if (VersionInfo.appVersion === update.appVersion) {
		// 			setIsShowUpdateModal(true);
		// 		}
		// 	}
		// };
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

		const linking: LinkingOptions<{ any }> = {
			prefixes: ['https://mezon.ai', 'mezon.ai://', 'mezon://'],
			config: {
				screens: {
					[`${APP_SCREEN.HOME}`]: {
						path: 'home'
					},
					[`${APP_SCREEN.CHANNEL_APP}`]: {
						path: 'channel-app/:code',
						parse: {
							code: (code) => `${code}`
						}
					}
				}
			},
			// Add this debugging to see what's happening
			getStateFromPath: (path, config) => {
				if (path && Platform.OS === 'android') {
					setTimeout(() => {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_NAVIGATION_DEEPLINK, path);
					}, 1000);
				}
				return getStateFromPath(path, config);
			}
		};

		return (
			<NavigationContainer
				theme={theme}
				onReady={async () => {
					await BootSplash.hide({ fade: true });
				}}
				linking={linking}
			>
				<StatusBar
					animated
					translucent
					backgroundColor={themeValue.primary}
					barStyle={themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content'}
				/>
				<NetInfoComp />
				<RootListener />
				<SafeAreaProvider>
					<SafeAreaView
						edges={Platform.OS === 'android' ? (isThreeButtonNav ? ['top', 'bottom'] : ['top']) : []}
						style={{ flex: 1, backgroundColor: themeValue.primary }}
					>
						<RootStack {...props} />
					</SafeAreaView>
				</SafeAreaProvider>
			</NavigationContainer>
		);
	},
	() => true
);

const RootNavigation = (props) => {
	const mezon = useMezon();
	const { store, persistor } = useMemo(() => {
		if (!mezon) {
			return { store: null, persistor: null };
		}
		if (mezon?.sessionRef) {
			const config = extractAndSaveConfig(mezon?.sessionRef as unknown as Session, true);
			if (config) saveMezonConfigToStorage(config.host, config.port, config.useSSL);
		}
		return initStore(mezon, undefined);
	}, [mezon]);

	return (
		<MezonStoreProvider store={store} loading={null} persistor={persistor}>
			<ThemeProvider>
				<ChatContextProvider>
					<WebRTCStreamProvider>
						<DeviceProvider>
							<PermissionProvider>
								<EmojiSuggestionProvider isMobile={true}>
									<KeyboardProvider statusBarTranslucent>
										<NavigationMain {...props} />
									</KeyboardProvider>
								</EmojiSuggestionProvider>
							</PermissionProvider>
						</DeviceProvider>
					</WebRTCStreamProvider>
				</ChatContextProvider>
				<Toast config={toastConfig} />
			</ThemeProvider>
		</MezonStoreProvider>
	);
};

export default RootNavigation;
