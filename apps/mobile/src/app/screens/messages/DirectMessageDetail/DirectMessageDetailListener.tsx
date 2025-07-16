import { ChatContext } from '@mezon/core';
import { ActionEmitEvent, STORAGE_CLAN_ID, STORAGE_IS_LAST_ACTIVE_TAB_DM, load, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { clansActions, directActions, getStore, selectDmGroupCurrentId, selectIdMessageToJump, useAppDispatch } from '@mezon/store-mobile';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, Platform, StatusBar, View } from 'react-native';
import { useSelector } from 'react-redux';

export const DirectMessageDetailListener = memo(({ dmType, directMessageId }: { dmType: number; directMessageId: string }) => {
	const { themeValue } = useTheme();
	const navigation = useNavigation();
	const dispatch = useAppDispatch();
	const currentDirectId = useSelector(selectDmGroupCurrentId);

	const isFetchMemberChannelDmRef = useRef(false);
	const { handleReconnect } = useContext(ChatContext);
	const appStateRef = useRef(AppState.currentState);

	const fetchMemberChannel = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
		const currentClanIdCached = await load(STORAGE_CLAN_ID);
		if (!currentClanIdCached) {
			return;
		}
		dispatch(clansActions.setCurrentClanId(currentClanIdCached));
		// Rejoin previous clan (other than 0) when exiting the DM detail screen
		dispatch(clansActions.joinClan({ clanId: currentClanIdCached }));
		handleReconnect('DM detail reconnect attempt');
		dispatch(directActions.fetchDirectMessage({ noCache: true }));
	};

	const directMessageLoader = async () => {
		save(STORAGE_IS_LAST_ACTIVE_TAB_DM, 'true');
		await dispatch(
			directActions.joinDirectMessage({
				directMessageId: directMessageId,
				type: dmType,
				noCache: true,
				isFetchingLatestMessages: true,
				isClearMessage: true
			})
		);
		handleReconnect('DM detail reconnect attempt loader');
	};

	useFocusEffect(
		useCallback(() => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.primary);
			}
			requestAnimationFrame(async () => {
				const store = getStore();
				const idMessageToJump = selectIdMessageToJump(store.getState());
				if (idMessageToJump?.id) return;
				await directMessageLoader();
			});
		}, [])
	);

	useEffect(() => {
		const blurListener = navigation.addListener('blur', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
		});
		return () => {
			blurListener();
		};
	}, [navigation, themeValue.secondary]);

	useEffect(() => {
		const onMentionHashtagDM = DeviceEventEmitter.addListener(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, ({ isFetchMemberChannelDM }) => {
			isFetchMemberChannelDmRef.current = isFetchMemberChannelDM;
		});
		return () => {
			onMentionHashtagDM.remove();
		};
	}, []);

	useEffect(() => {
		return () => {
			save(STORAGE_IS_LAST_ACTIVE_TAB_DM, 'false');
			dispatch(directActions.setDmGroupCurrentId(''));
			if (!isFetchMemberChannelDmRef.current) {
				requestAnimationFrame(async () => {
					await fetchMemberChannel();
				});
			}
		};
	}, [isFetchMemberChannelDmRef]);

	const handleAppStateChange = async (state: string) => {
		if (state === 'active' && currentDirectId) {
			directMessageLoader();
		}
	};

	const handleAppStateChangeListener = (nextAppState: typeof AppState.currentState) => {
		if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
			handleAppStateChange(nextAppState);
		}

		appStateRef.current = nextAppState;
	};

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
		return () => {
			appStateSubscription.remove();
		};
	}, [currentDirectId]);

	return <View />;
});
