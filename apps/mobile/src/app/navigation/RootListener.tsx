import { ChatContext } from '@mezon/core';
import { load, save, setCurrentClanLoader, STORAGE_CLAN_ID, STORAGE_IS_DISABLE_LOAD_BACKGROUND, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import {
	accountActions,
	appActions,
	channelsActions,
	clansActions,
	directActions,
	emojiSuggestionActions,
	fcmActions,
	FetchClansPayload,
	friendsActions,
	getStore,
	gifsActions,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDmGroupCurrentId,
	selectIsFromFCMMobile,
	selectIsLogin,
	selectSession,
	settingClanStickerActions,
	topicsActions,
	useAppDispatch,
	voiceActions,
	walletActions
} from '@mezon/store-mobile';
import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { ChannelType, Session } from 'mezon-js';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { getVoIPToken, handleFCMToken } from '../utils/pushNotificationHelpers';

const analytics = getAnalytics(getApp());
const RootListener = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		if (isLoggedIn) {
			requestIdleCallback(() => {
				dispatch(topicsActions.setCurrentTopicId(''));
				setTimeout(() => {
					initAppLoading();
					mainLoader();
				}, 3000);
			});
		}
	}, [isLoggedIn]);

	const loadFRMConfig = useCallback(
		async (username: string, sessionMain: Session) => {
			try {
				if (!username) {
					return;
				}
				const fcmtoken = await handleFCMToken();
				const voipToken = Platform.OS === 'ios' ? await getVoIPToken() : '';
				if (fcmtoken) {
					dispatch(
						fcmActions.registFcmDeviceToken({
							session: sessionMain as Session,
							tokenId: fcmtoken,
							deviceId: username,
							platform: Platform.OS,
							voipToken
						})
					);
				}
			} catch (error) {
				console.error('Error loading FCM config:', error);
			}
		},
		[dispatch]
	);

	const initAppLoading = async () => {
		const isDisableLoad = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
		const isFromFCM = isDisableLoad?.toString() === 'true';
		await mainLoaderTimeout({ isFromFCM });
	};

	const activeAgainLoaderBackground = useCallback(async () => {
		try {
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState() as any);
			dispatch(appActions.setLoadingMainMobile(false));
			if (currentClanId) {
				const promise = [
					dispatch(
						voiceActions.fetchVoiceChannelMembers({
							clanId: currentClanId ?? '',
							channelId: '',
							channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE
						})
					),
					dispatch(channelsActions.fetchChannels({ clanId: currentClanId, noCache: true, isMobile: true }))
				];
				await Promise.allSettled(promise);
			}
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
			dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
			return null;
		} catch (error) {
			/* empty */
		}
	}, [dispatch]);

	const messageLoaderBackground = useCallback(async () => {
		try {
			const store = getStore();
			const currentChannelId = selectCurrentChannelId(store.getState() as any);
			const currentClanId = selectCurrentClanId(store.getState() as any);
			dispatch(appActions.setLoadingMainMobile(false));
			if (currentChannelId) {
				dispatch(
					messagesActions.fetchMessages({
						channelId: currentChannelId,
						noCache: true,
						isFetchingLatestMessages: true,
						isClearMessage: true,
						clanId: currentClanId
					})
				);
			}
			return null;
		} catch (error) {
			/* empty */
		}
	}, [dispatch]);

	const handleAppStateChange = useCallback(
		async (state: string) => {
			const store = getStore();
			const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			// Note: if is DM
			const currentDirectId = selectDmGroupCurrentId(store.getState());
			const isFromFcmMobile = selectIsFromFCMMobile(store.getState());
			if (state === 'active') {
				await activeAgainLoaderBackground();
			}
			if (state === 'active' && !currentDirectId) {
				handleReconnect('Initial reconnect attempt timeout');
				if (isFromFCM?.toString() === 'true' || isFromFcmMobile) {
					/* empty */
				} else {
					await messageLoaderBackground();
				}
			}
		},
		[activeAgainLoaderBackground, handleReconnect, messageLoaderBackground]
	);

	const logAppStarted = async () => {
		try {
			await setAnalyticsCollectionEnabled(analytics, true);
			await logEvent(analytics, 'app_started_NEW', {
				platform: Platform.OS
			});
		} catch (error) {
			console.error('Failed to log app started event:');
		}
	};

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
		logAppStarted();
		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const handleAppStateChangeListener = useCallback((nextAppState: typeof AppState.currentState) => {
		if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
			handleAppStateChange(nextAppState);
		}

		appStateRef.current = nextAppState;
	}, []);

	const profileLoader = useCallback(async () => {
		try {
			const store = await getStore();
			const session = selectSession(store.getState() as any);

			const sessionMain = new Session(
				session?.token,
				session?.refresh_token,
				session.created,
				session.api_url,
				session.id_token || '',
				!!session.is_remember
			);
			const profileResponse = await dispatch(accountActions.getUserProfile());
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const { id = '', username = '' } = profileResponse?.payload?.user || {};
			if (id) {
				save(STORAGE_MY_USER_ID, id?.toString());
				await dispatch(
					walletActions.fetchWalletDetail({
						userId: id
					})
				);
			}
			await loadFRMConfig(username, sessionMain);
		} catch (e) {
			console.error('log => profileLoader: ', e);
		}
	}, [dispatch, loadFRMConfig]);

	const mainLoader = useCallback(async () => {
		try {
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState() as any);
			const promises = [];
			promises.push(dispatch(listUsersByUserActions.fetchListUsersByUser({ noCache: true })));
			promises.push(dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true })));
			promises.push(dispatch(friendsActions.fetchListFriends({ noCache: true })));
			promises.push(dispatch(clansActions.joinClan({ clanId: '0' })));
			promises.push(dispatch(directActions.fetchDirectMessage({ noCache: true })));
			promises.push(dispatch(emojiSuggestionActions.fetchEmoji({ noCache: true, clanId: currentClanId })));
			promises.push(dispatch(settingClanStickerActions.fetchStickerByUserId({ noCache: true, clanId: currentClanId })));
			promises.push(dispatch(gifsActions.fetchGifCategories()));
			promises.push(dispatch(gifsActions.fetchGifCategoryFeatured()));
			await Promise.allSettled(promises);
			return null;
		} catch (error) {
			console.error('error mainLoader', error);
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [dispatch]);

	const mainLoaderTimeout = useCallback(
		async ({ isFromFCM = false }) => {
			try {
				const store = getStore();
				const currentClanId = selectCurrentClanId(store.getState() as any);
				const response = await dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
				dispatch(appActions.setLoadingMainMobile(false));
				const currentClanIdCached = await load(STORAGE_CLAN_ID);
				const payload = response?.payload as FetchClansPayload;
				const clans = payload?.clans ?? [];
				const isExistClanId = clans?.some((clan) => clan?.clan_id?.toString() === currentClanId);
				const clanId = !isExistClanId ? clans?.[0]?.clan_id : currentClanId?.toString() !== '0' ? currentClanId : currentClanIdCached;
				const promises = [];
				if (!isFromFCM && clanId) {
					save(STORAGE_CLAN_ID, clanId);
					promises.push(dispatch(clansActions.joinClan({ clanId })));
					promises.push(dispatch(clansActions.changeCurrentClan({ clanId })));
				}
				const results = await Promise.all(promises);
				if (!isFromFCM && !clanId) {
					const clanResp = results.find((result) => result.type === 'clans/fetchClans/fulfilled');
					if (clanResp?.payload || clanResp?.payload?.clans) {
						await setCurrentClanLoader(clanResp?.payload?.clans || clanResp?.payload, clanId, false);
					}
				}
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				return null;
			} catch (error) {
				console.error('error mainLoader', error);
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[dispatch]
	);

	useEffect(() => {
		if (isLoggedIn) {
			requestIdleCallback(() => {
				setTimeout(() => {
					profileLoader();
				}, 2000);
			});
		}
	}, [isLoggedIn, profileLoader]);

	return null;
};

export default RootListener;
