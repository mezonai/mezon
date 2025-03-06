import { useMemberStatus, useSeenMessagePool } from '@mezon/core';
import { ActionEmitEvent, Icons, STORAGE_CLAN_ID, STORAGE_IS_DISABLE_LOAD_BACKGROUND, load, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	MessagesEntity,
	appActions,
	clansActions,
	directActions,
	getStoreAsync,
	gifsStickerEmojiActions,
	messagesActions,
	selectCurrentChannel,
	selectDmGroupCurrent,
	selectLastMessageByChannelId,
	selectMemberClanByUserId2,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { SubPanelName, createImgproxyUrl } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, DeviceEventEmitter, Image, Pressable, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { UserStatus } from '../../../components/UserStatus';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getUserStatusByMetadata } from '../../../utils/helpers';
import { ChatMessageWrapper } from '../ChatMessageWrapper';
import { style } from './styles';

function useChannelSeen(channelId: string) {
	const dispatch = useAppDispatch();
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const mounted = useRef('');

	const updateChannelSeenState = (channelId: string, lastMessage: MessagesEntity) => {
		dispatch(directActions.setActiveDirect({ directId: channelId }));
	};

	const { markAsReadSeen } = useSeenMessagePool();
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));
	useEffect(() => {
		if (lastMessage) {
			return;
		}
		const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;

		markAsReadSeen(lastMessage, mode);
	}, [lastMessage, channelId]);

	useEffect(() => {
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [channelId]);

	useEffect(() => {
		if (lastMessage) {
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
	useChannelSeen(directMessageId || '');

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

	const firstUserId = useMemo(() => {
		return currentDmGroup?.user_id?.[0];
	}, [currentDmGroup?.user_id?.[0]]);

	const userStatus = useMemberStatus(isModeDM ? firstUserId : '');

	const user = useSelector((state) => selectMemberClanByUserId2(state, firstUserId));
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
				directMessageLoader();
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
			<View style={styles.headerWrapper}>
				<Pressable style={styles.channelTitle} onPress={() => navigateToThreadDetail()}>
					{isTypeDMGroup ? (
						<View style={styles.groupAvatar}>
							<Icons.GroupIcon width={18} height={18} />
						</View>
					) : (
						<View style={styles.avatarWrapper}>
							{dmAvatar ? (
								<Image
									source={{ uri: createImgproxyUrl(dmAvatar ?? '', { width: 100, height: 100, resizeType: 'fit' }) }}
									style={styles.friendAvatar}
								/>
							) : (
								<View style={styles.wrapperTextAvatar}>
									<Text style={[styles.textAvatar]}>{dmLabel?.charAt?.(0)}</Text>
								</View>
							)}
							<UserStatus status={userStatus} customStatus={status} />
						</View>
					)}
					<Text style={styles.titleText} numberOfLines={1}>
						{dmLabel}
					</Text>
				</Pressable>
				<View style={styles.actions}>
					{/* TODO: update later */}
					{/* <CallIcon />
                    <VideoIcon /> */}
				</View>
			</View>
			{directMessageId && <ChatMessageWrapper directMessageId={directMessageId} isModeDM={isModeDM} currentClanId={'0'} />}
		</View>
	);
};
