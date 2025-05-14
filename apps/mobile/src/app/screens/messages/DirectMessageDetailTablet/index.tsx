import { useMemberStatus, useSeenMessagePool } from '@mezon/core';
import { ActionEmitEvent, STORAGE_CLAN_ID, STORAGE_IS_DISABLE_LOAD_BACKGROUND, load, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	MessagesEntity,
	appActions,
	channelsActions,
	clansActions,
	directActions,
	directMetaActions,
	getStoreAsync,
	messagesActions,
	selectCurrentChannel,
	selectDmGroupCurrent,
	selectLastMessageByChannelId,
	selectLastSeenMessageStateByChannelId,
	selectMemberClanByUserId2,
	selectPreviousChannels,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getUserStatusByMetadata } from '../../../utils/helpers';
import { ChatMessageWrapper } from '../ChatMessageWrapper';
import HeaderDirectMessage from '../DirectMessageDetail/HeaderDirectMessage';
import { style } from './styles';

function useChannelSeen(channelId: string, currentDmGroup: any) {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const lastMessageState = useSelector((state) => selectLastSeenMessageStateByChannelId(state, channelId as string));
	const mounted = useRef('');

	const updateChannelSeenState = (channelId: string, lastMessage: MessagesEntity) => {
		dispatch(directActions.setActiveDirect({ directId: channelId }));
	};

	const previousChannels = useSelector(selectPreviousChannels);
	const { markAsReadSeen } = useSeenMessagePool();
	useEffect(() => {
		if (!lastMessage) return;
		const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
		if (!lastMessageState) {
			markAsReadSeen(lastMessage, mode, 0);
			return;
		}

		if (
			lastMessage?.create_time_seconds &&
			lastMessageState?.timestamp_seconds &&
			lastMessage?.create_time_seconds >= lastMessageState?.timestamp_seconds
		) {
			markAsReadSeen(lastMessage, mode, 0);
		}
	}, [lastMessage, channelId, currentDmGroup?.type, lastMessageState, markAsReadSeen]);
	useEffect(() => {
		if (previousChannels.at(1)) {
			const timestamp = Date.now() / 1000;
			dispatch(
				channelsActions.updateChannelBadgeCount({
					clanId: previousChannels.at(1)?.clanId || '',
					channelId: previousChannels.at(1)?.channelId || '',
					count: 0,
					isReset: true
				})
			);
			dispatch(directActions.removeBadgeDirect({ channelId: channelId }));
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: previousChannels.at(1)?.channelId as string, timestamp }));
		}
	}, [previousChannels]);
	useEffect(() => {
		if (lastMessage) {
			dispatch(directMetaActions.updateLastSeenTime(lastMessage));
			updateChannelSeenState(channelId, lastMessage);
		}
	}, []);

	useEffect(() => {
		if (mounted.current === channelId) {
			return;
		}
		if (lastMessage) {
			mounted.current = channelId;
			updateChannelSeenState(channelId, lastMessage);
		}
	}, [dispatch, channelId, lastMessage]);
}

export const DirectMessageDetailTablet = ({ directMessageId }: { directMessageId?: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();

	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	useChannelSeen(directMessageId || '', currentDmGroup);

	const currentChannel = useSelector(selectCurrentChannel);
	const isFetchMemberChannelDmRef = useRef(false);
	const isModeDM = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDmGroup?.type]);

	const isTypeDMGroup = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currentDmGroup?.type]);

	const dmType = useMemo(() => {
		return currentDmGroup?.type;
	}, [currentDmGroup?.type]);

	const dmLabel: string = useMemo(() => {
		return (
			currentDmGroup?.channel_label ||
			(typeof currentDmGroup?.usernames === 'string' ? currentDmGroup?.usernames : currentDmGroup?.usernames?.[0] || '')
		);
	}, [currentDmGroup?.channel_label, currentDmGroup?.usernames]);

	const dmAvatar = useMemo(() => {
		return currentDmGroup?.channel_avatar?.[0];
	}, [currentDmGroup?.channel_avatar?.[0]]);

	const userStatus = useMemberStatus(isModeDM ? currentDmGroup?.user_id?.[0] : '');

	const user = useSelector((state) => selectMemberClanByUserId2(state, currentDmGroup?.user_id?.[0]));
	const status = getUserStatusByMetadata(user?.user?.metadata);

	const navigateToThreadDetail = () => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET, params: { directMessage: currentDmGroup } });
	};

	const fetchMemberChannel = useCallback(async () => {
		const currentClanIdCached = await load(STORAGE_CLAN_ID);
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, null);

		if (!currentClanIdCached) {
			return;
		}
		const store = await getStoreAsync();
		store.dispatch(clansActions.setCurrentClanId(currentClanIdCached));
		// Rejoin previous clan (other than 0) when exiting the DM detail screen
		store.dispatch(clansActions.joinClan({ clanId: currentClanIdCached }));
	}, []);

	const directMessageLoader = useCallback(async () => {
		const store = await getStoreAsync();
		await Promise.all([
			store.dispatch(clansActions.setCurrentClanId('0')),
			store.dispatch(
				directActions.joinDirectMessage({
					directMessageId: directMessageId,
					type: dmType,
					noCache: true,
					isFetchingLatestMessages: true,
					isClearMessage: true
				})
			)
		]);
		save(STORAGE_CLAN_ID, currentChannel?.clan_id);
	}, [currentChannel?.clan_id, directMessageId, dmType]);

	useEffect(() => {
		const onMentionHashtagDM = DeviceEventEmitter.addListener(ActionEmitEvent.FETCH_MEMBER_CHANNEL_DM, ({ isFetchMemberChannelDM }) => {
			isFetchMemberChannelDM.current = isFetchMemberChannelDM;
		});
		return () => {
			onMentionHashtagDM.remove();
		};
	}, []);

	useEffect(() => {
		return () => {
			if (!isFetchMemberChannelDmRef.current) {
				fetchMemberChannel();
			}
		};
	}, [fetchMemberChannel, isFetchMemberChannelDmRef]);

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

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			appStateSubscription.remove();
		};
	}, [directMessageId, directMessageId]);

	const handleAppStateChange = async (state: string) => {
		if (state === 'active') {
			try {
				const store = await getStoreAsync();
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
				store.dispatch(
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
				const store = await getStoreAsync();
				store.dispatch(appActions.setIsFromFCMMobile(false));
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
			}
		}
	};

	return (
		<View style={styles.dmMessageContainer}>
			<HeaderDirectMessage directMessageId={directMessageId} styles={styles} themeValue={themeValue} />
			{directMessageId && <ChatMessageWrapper directMessageId={directMessageId} isModeDM={isModeDM} currentClanId={'0'} />}
		</View>
	);
};
