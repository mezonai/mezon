/* eslint-disable no-console */
import {
	MezonStoreProvider,
	accountActions,
	appActions,
	authActions,
	clansActions,
	directActions,
	emojiSuggestionActions,
	friendsActions,
	getStoreAsync,
	initStore,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectHasInternetMobile,
	selectIsFromFCMMobile,
	selectIsLogin,
	voiceActions
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChatContext, ChatContextProvider } from '@mezon/core';
import { IWithError, sleep } from '@mezon/utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	ActionEmitEvent,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_CLAN_ID,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	jumpToChannel,
	load,
	remove,
	save,
	setCurrentClanLoader
} from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import notifee from '@notifee/react-native';
import { ChannelType } from 'mezon-js';
import { AppState, DeviceEventEmitter, InteractionManager, Platform, StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import codePush from 'react-native-code-push';
import Toast from 'react-native-toast-message';
import VersionInfo from 'react-native-version-info';
import MezonUpdateVersionModal from '../componentUI/MezonUpdateVersionModal';
import NetInfoComp from '../components/NetworkInfo';
import { toastConfig } from '../configs/toastConfig';
import RootStack from './RootStack';

const NavigationMain = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const hasInternet = useSelector(selectHasInternetMobile);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isFromFcmMobile = useSelector(selectIsFromFCMMobile);
	const [isReadyForUse, setIsReadyForUse] = useState<boolean>(false);
	const { handleReconnect } = useContext(ChatContext);
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

	useEffect(() => {
		let timer: string | number | NodeJS.Timeout;
		if (isLoggedIn) {
			mainLoader();
			timer = setTimeout(async () => {
				InteractionManager.runAfterInteractions(() => {
					initAppLoading();
				});
				// timeout 2000s to check app open from FCM or nomarly
			}, 2000);
		}
		return () => {
			clearTimeout(timer);
		};
	}, [isLoggedIn]);

	useEffect(() => {
		if (isLoggedIn && hasInternet) {
			refreshMessageInitApp();
			authLoader();
		}
	}, [isLoggedIn, hasInternet]);

	const refreshMessageInitApp = useCallback(async () => {
		const store = await getStoreAsync();
		store.dispatch(appActions.setLoadingMainMobile(false));
		if (currentChannelId) {
			store.dispatch(
				messagesActions.fetchMessages({
					channelId: currentChannelId,
					noCache: true,
					isFetchingLatestMessages: true,
					isClearMessage: true,
					clanId: currentClanId
				})
			);
		}
	}, [currentChannelId, currentClanId]);

	const initAppLoading = async () => {
		const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
		await mainLoaderTimeout({ isFromFCM: isFromFCM?.toString() === 'true' });
	};

	const messageLoaderBackground = useCallback(async () => {
		try {
			if (!currentChannelId) {
				return null;
			}
			const store = await getStoreAsync();
			handleReconnect('Initial reconnect attempt');
			store.dispatch(appActions.setLoadingMainMobile(false));
			await notifee.cancelAllNotifications();
			const promise = [
				store.dispatch(
					messagesActions.fetchMessages({
						channelId: currentChannelId,
						noCache: true,
						isFetchingLatestMessages: true,
						isClearMessage: true,
						clanId: currentClanId
					})
				),
				store.dispatch(
					voiceActions.fetchVoiceChannelMembers({
						clanId: currentClanId ?? '',
						channelId: '',
						channelType: ChannelType.CHANNEL_TYPE_VOICE
					})
				)
			];
			await Promise.all(promise);
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
			return null;
		} catch (error) {
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
		}
	}, [currentChannelId, currentClanId, handleReconnect]);

	const handleAppStateChange = useCallback(
		async (state: string) => {
			const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			// Note: if currentClanId === 0 is current DM
			if (state === 'active' && currentClanId !== '0') {
				DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: false });
				if (isFromFCM?.toString() === 'true' || isFromFcmMobile) {
					DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
				} else {
					await messageLoaderBackground();
				}
			}
		},
		[currentClanId, isFromFcmMobile, messageLoaderBackground]
	);

	useEffect(() => {
		// Trigger when app is in background back to active
		let timeout: string | number | NodeJS.Timeout;
		const appStateSubscription = AppState.addEventListener('change', (state) => {
			if (isLoggedIn)
				timeout = setTimeout(async () => {
					await handleAppStateChange(state);
				}, 200);
		});
		return () => {
			appStateSubscription.remove();
			timeout && clearTimeout(timeout);
		};
	}, [currentChannelId, isFromFcmMobile, isLoggedIn, currentClanId, handleAppStateChange]);

	const authLoader = useCallback(async () => {
		const store = await getStoreAsync();
		try {
			const response = await store.dispatch(authActions.refreshSession());
			if ((response as unknown as IWithError).error) {
				console.log('Session expired');
				return;
			}
			const profileResponse = await store.dispatch(accountActions.getUserProfile());
			if ((profileResponse as unknown as IWithError).error) {
				console.log('Session expired');
				return;
			}
		} catch (error) {
			console.log('error authLoader', error);
		}
	}, []);

	const mainLoader = useCallback(async () => {
		const store = await getStoreAsync();
		try {
			const promises = [];
			promises.push(store.dispatch(listUsersByUserActions.fetchListUsersByUser({ noCache: true })));
			promises.push(store.dispatch(friendsActions.fetchListFriends({})));
			promises.push(store.dispatch(clansActions.joinClan({ clanId: '0' })));
			promises.push(store.dispatch(directActions.fetchDirectMessage({})));
			promises.push(store.dispatch(emojiSuggestionActions.fetchEmoji({ noCache: true })));
			promises.push(store.dispatch(listChannelsByUserActions.fetchListChannelsByUser({})));
			await Promise.all(promises);
			return null;
		} catch (error) {
			console.log('error mainLoader', error);
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	}, []);

	const mainLoaderTimeout = useCallback(
		async ({ isFromFCM = false }) => {
			const store = await getStoreAsync();
			try {
				store.dispatch(appActions.setLoadingMainMobile(false));
				const currentClanIdCached = await load(STORAGE_CLAN_ID);
				const clanId = currentClanId?.toString() !== '0' ? currentClanId : currentClanIdCached;
				const promises = [];
				promises.push(store.dispatch(clansActions.fetchClans()));
				if (!isFromFCM) {
					if (clanId) {
						save(STORAGE_CLAN_ID, clanId);
						promises.push(store.dispatch(clansActions.joinClan({ clanId })));
						promises.push(store.dispatch(clansActions.changeCurrentClan({ clanId, noCache: true })));
					}
				}
				const results = await Promise.all(promises);
				if (!isFromFCM) {
					if (currentChannelId && clanId) {
						await jumpToChannel(currentChannelId, clanId);
					} else {
						const clanResp = results.find((result) => result.type === 'clans/fetchClans/fulfilled');
						if (clanResp && !clanId) {
							await setCurrentClanLoader(clanResp.payload);
						}
					}
				}
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				return null;
			} catch (error) {
				console.log('error mainLoader', error);
				store.dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[currentClanId]
	);

	const checkForUpdate = async () => {
		// const update = await codePush.checkForUpdate(process.env.NX_CODE_PUSH_KEY_MOBILE as string);
		const update = await codePush.checkForUpdate('JT3Y22ATCAz3K-IadwV5RGntE6PT5hO0FuaudV');
		if (VersionInfo.appVersion === update?.appVersion) {
			setIsShowUpdateModal(true);
		}
	};
	return (
		<NavigationContainer>
			<NetInfoComp />
			{isReadyForUse && <MezonUpdateVersionModal visible={isShowUpdateModal} onClose={() => setIsShowUpdateModal(false)} />}
			{isReadyForUse && <RootStack />}
		</NavigationContainer>
	);
};

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
