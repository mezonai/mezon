import { ChatContext, useMemberStatus } from '@mezon/core';
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
import { AppState, DeviceEventEmitter, Platform, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import SwipeBackContainer from '../../home/homedrawer/SwipeBackContainer';
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

	const isModeDM = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDmGroup?.type]);

	const isTypeDMGroup = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currentDmGroup?.type]);

	const dmType = useMemo(() => {
		return currentDmGroup?.type;
	}, [currentDmGroup?.type]);

	const dmLabel = useMemo(() => {
		return (currentDmGroup?.channel_label ||
			(typeof currentDmGroup?.usernames === 'string' ? currentDmGroup?.usernames : currentDmGroup?.usernames?.[0] || '')) as string;
	}, [currentDmGroup?.channel_label, currentDmGroup?.usernames]);

	const dmAvatar = useMemo(() => {
		return currentDmGroup?.channel_avatar?.[0];
	}, [currentDmGroup?.channel_avatar?.[0]]);

	const firstUserId = useMemo(() => {
		return currentDmGroup?.user_id?.[0];
	}, [currentDmGroup?.user_id?.[0]]);

	const userStatus = useMemberStatus(isModeDM ? firstUserId : '');

	const navigateToThreadDetail = useCallback(() => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET, params: { directMessage: currentDmGroup } });
	}, [currentDmGroup, navigation]);

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
					DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: false });
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
					DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
				} catch (error) {
					dispatch(appActions.setIsFromFCMMobile(false));
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
					DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
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
		if (APP_SCREEN.MESSAGES.NEW_GROUP === from) {
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			return;
		}
		navigation.goBack();
	}, [from, navigation]);

	return (
		<SwipeBackContainer>
			<HeaderDirectMessage
				handleBack={handleBack}
				navigateToThreadDetail={navigateToThreadDetail}
				isTypeDMGroup={isTypeDMGroup}
				dmAvatar={dmAvatar}
				dmLabel={dmLabel}
				userStatus={userStatus}
				styles={styles}
				themeValue={themeValue}
				directMessageId={directMessageId}
				firstUserId={firstUserId}
			/>
			{directMessageId && <ChatMessageWrapper directMessageId={directMessageId} isModeDM={isModeDM} currentClanId={'0'} />}
		</SwipeBackContainer>
	);
};
