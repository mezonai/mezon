import { ChatContext } from '@mezon/core';
import {
	ActionEmitEvent,
	STORAGE_CLAN_ID,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	STORAGE_IS_LAST_ACTIVE_TAB_DM,
	load,
	save
} from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { appActions, channelsActions, clansActions, directActions, messagesActions, selectDmGroupCurrent, useAppDispatch } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState, DeviceEventEmitter, Platform, StatusBar, View } from 'react-native';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import { ChatMessageWrapper } from '../ChatMessageWrapper';
import HeaderDirectMessage from './HeaderDirectMessage';
import { style } from './styles';

export const DirectMessageDetailScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const directMessageId = route.params?.directMessageId as string;
	const dispatch = useAppDispatch();

	const from = route.params?.from;
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	const isFetchMemberChannelDmRef = useRef(false);
	const { handleReconnect } = useContext(ChatContext);

	const dmType = useMemo(() => {
		return currentDmGroup?.type;
	}, [currentDmGroup?.type]);

	const fetchMemberChannel = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);
		const currentClanIdCached = await load(STORAGE_CLAN_ID);
		if (!currentClanIdCached) {
			return;
		}
		dispatch(clansActions.setCurrentClanId(currentClanIdCached));
		// Rejoin previous clan (other than 0) when exiting the DM detail screen
		dispatch(clansActions.joinClan({ clanId: currentClanIdCached }));
	};

	const directMessageLoader = async () => {
		save(STORAGE_IS_LAST_ACTIVE_TAB_DM, 'true');
		await Promise.all([
			// dispatch(clansActions.setCurrentClanId('0')),
			dispatch(
				directActions.joinDirectMessage({
					directMessageId: directMessageId,
					type: dmType,
					noCache: true,
					isFetchingLatestMessages: true,
					isClearMessage: true
				})
			)
		]);
	};

	useEffect(() => {
		const focusedListener = navigation.addListener('focus', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.primary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content');
		});
		const blurListener = navigation.addListener('blur', () => {
			if (Platform.OS === 'android') {
				StatusBar.setBackgroundColor(themeValue.secondary);
			}
			StatusBar.setBarStyle(themeBasic === ThemeModeBase.DARK ? 'light-content' : 'dark-content');
		});
		return () => {
			focusedListener();
			blurListener();
		};
	}, [navigation, themeBasic, themeValue.primary, themeValue.secondary]);

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

	useEffect(() => {
		let timeout: NodeJS.Timeout;
		if (directMessageId) {
			timeout = setTimeout(() => {
				requestAnimationFrame(async () => {
					await directMessageLoader();
				});
			}, 100);
		}

		return () => {
			timeout && clearTimeout(timeout);
		};
	}, [directMessageId]);

	const handleAppStateChange = useCallback(
		async (state: string) => {
			if (state === 'active') {
				try {
					handleReconnect('DM detail reconnect attempt');
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
					dispatch(
						channelsActions.joinChat({
							clanId: '0',
							channelId: directMessageId,
							channelType: dmType ?? 0,
							isPublic: false
						})
					);
					dispatch(
						messagesActions.fetchMessages({
							channelId: directMessageId,
							noCache: true,
							isFetchingLatestMessages: true,
							isClearMessage: true,
							clanId: '0'
						})
					);
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				} catch (error) {
					dispatch(appActions.setIsFromFCMMobile(false));
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				}
			}
		},
		[directMessageId, dmType, handleReconnect]
	);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			appStateSubscription.remove();
		};
	}, [directMessageId, dmType, handleAppStateChange]);

	const handleBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	return (
		<View style={{ flex: 1 }}>
			<StatusBarHeight />
			<HeaderDirectMessage from={from} styles={styles} themeValue={themeValue} directMessageId={directMessageId} />
			{directMessageId && (
				<ChatMessageWrapper directMessageId={directMessageId} isModeDM={Number(dmType) === ChannelType.CHANNEL_TYPE_DM} currentClanId={'0'} />
			)}
		</View>
	);
};
