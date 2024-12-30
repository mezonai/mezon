/* eslint-disable no-console */
import {
	accountActions,
	acitvitiesActions,
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	emojiSuggestionActions,
	friendsActions,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectIsFromFCMMobile,
	selectIsLogin,
	useAppDispatch,
	userStatusActions,
	voiceActions
} from '@mezon/store-mobile';
import React, { useCallback, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChatContext } from '@mezon/core';
import { IWithError } from '@mezon/utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	ActionEmitEvent,
	STORAGE_CLAN_ID,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	jumpToChannel,
	load,
	save,
	setCurrentClanLoader
} from '@mezon/mobile-components';
import notifee from '@notifee/react-native';
import { ChannelType } from 'mezon-js';
import { AppState, DeviceEventEmitter, InteractionManager, View } from 'react-native';

const RootListener = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isFromFcmMobile = useSelector(selectIsFromFCMMobile);
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();

	useEffect(() => {
		let timer: string | number | NodeJS.Timeout;
		if (isLoggedIn) {
			refreshMessageInitApp();
			authLoader();
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

	const refreshMessageInitApp = useCallback(async () => {
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
			dispatch(
				channelsActions.fetchChannels({
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
			handleReconnect('Initial reconnect attempt');
			dispatch(appActions.setLoadingMainMobile(false));
			await notifee.cancelAllNotifications();
			const promise = [
				dispatch(
					messagesActions.fetchMessages({
						channelId: currentChannelId,
						noCache: true,
						isFetchingLatestMessages: true,
						isClearMessage: true,
						clanId: currentClanId
					})
				),
				dispatch(
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

	useEffect(() => {
		if (currentClanId && currentClanId?.toString() !== '0') {
			dispatch(channelsActions.fetchListFavoriteChannel({ clanId: currentClanId }));
		}
	}, [currentClanId]);

	const authLoader = useCallback(async () => {
		try {
			const response = await dispatch(authActions.refreshSession());
			if ((response as unknown as IWithError).error) {
				console.log('Session expired');
				return;
			}
			const profileResponse = await dispatch(accountActions.getUserProfile());
			if ((profileResponse as unknown as IWithError).error) {
				console.log('Session expired');
				return;
			}
		} catch (error) {
			console.log('error authLoader', error);
		}
	}, []);

	const mainLoader = useCallback(async () => {
		try {
			const promises = [];
			promises.push(dispatch(listUsersByUserActions.fetchListUsersByUser({})));
			promises.push(dispatch(friendsActions.fetchListFriends({})));
			promises.push(dispatch(clansActions.joinClan({ clanId: '0' })));
			promises.push(dispatch(directActions.fetchDirectMessage({})));
			promises.push(dispatch(emojiSuggestionActions.fetchEmoji({})));
			promises.push(dispatch(listChannelsByUserActions.fetchListChannelsByUser({})));
			promises.push(dispatch(userStatusActions.getUserStatus()));
			await Promise.all(promises);
			return null;
		} catch (error) {
			console.log('error mainLoader', error);
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, []);

	const mainLoaderTimeout = useCallback(
		async ({ isFromFCM = false }) => {
			try {
				dispatch(appActions.setLoadingMainMobile(false));
				const currentClanIdCached = await load(STORAGE_CLAN_ID);
				const clanId = currentClanId?.toString() !== '0' ? currentClanId : currentClanIdCached;
				const promises = [];
				promises.push(dispatch(clansActions.fetchClans()));
				promises.push(dispatch(acitvitiesActions.listActivities()));
				if (!isFromFCM) {
					if (clanId) {
						save(STORAGE_CLAN_ID, clanId);
						promises.push(dispatch(clansActions.joinClan({ clanId })));
						promises.push(dispatch(clansActions.changeCurrentClan({ clanId })));
					}
				}
				const results = await Promise.all(promises);
				if (!isFromFCM) {
					if (currentChannelId && clanId) {
						await jumpToChannel(currentChannelId, clanId);
					} else {
						const clanResp = results.find((result) => result.type === 'clans/fetchClans/fulfilled');
						if (clanResp) {
							await setCurrentClanLoader(clanResp.payload, clanId);
						}
					}
				}
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				return null;
			} catch (error) {
				console.log('error mainLoader', error);
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[currentChannelId, currentClanId]
	);

	return <View />;
};

export default RootListener;
