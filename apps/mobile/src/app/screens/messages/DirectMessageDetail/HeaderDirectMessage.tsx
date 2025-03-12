import { useMemberStatus, useSeenMessagePool } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import {
	channelsActions,
	directMetaActions,
	selectDmGroupCurrent,
	selectLastMessageByChannelId,
	selectMemberClanByUserId2,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { TIME_OFFSET, createImgproxyUrl } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import ImageNative from '../../../components/ImageNative';
import { UserStatus } from '../../../components/UserStatus';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getUserStatusByMetadata } from '../../../utils/helpers';

interface HeaderProps {
	from?: string;
	styles: any;
	themeValue: any;
	directMessageId: string;
}
function useChannelSeen(channelId: string, currentDmGroup: any) {
	const dispatch = useAppDispatch();
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const mounted = useRef('');

	const { markAsReadSeen } = useSeenMessagePool();

	const refCountWasCalled = useRef<number>(0);
	useEffect(() => {
		if (currentDmGroup?.type) {
			const mode =
				currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
			if (lastMessage && refCountWasCalled.current <= 1) {
				markAsReadSeen(lastMessage, mode);
				const timestamp = Date.now() / 1000;
				dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
				dispatch(directMetaActions.updateLastSeenTime(lastMessage));
				dispatch(channelsActions.updateChannelBadgeCount({ clanId: '0', channelId: channelId || '', count: 0, isReset: true }));
				refCountWasCalled.current += 1;
			}
		}
	}, [lastMessage, channelId, currentDmGroup?.type, markAsReadSeen, dispatch]);

	useEffect(() => {
		if (mounted.current === channelId) {
			return;
		}
		if (lastMessage) {
			mounted.current = channelId;
		}
	}, [dispatch, channelId, lastMessage]);
}

const HeaderDirectMessage: React.FC<HeaderProps> = ({ from, styles, themeValue, directMessageId }) => {
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	useChannelSeen(directMessageId || '', currentDmGroup);
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const user = useSelector((state) => selectMemberClanByUserId2(state, currentDmGroup?.user_id?.[0]));
	const status = getUserStatusByMetadata(user?.user?.metadata);

	const isModeDM = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDmGroup?.type]);

	const isTypeDMGroup = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currentDmGroup?.type]);

	const dmLabel = useMemo(() => {
		return (currentDmGroup?.channel_label ||
			(typeof currentDmGroup?.usernames === 'string' ? currentDmGroup?.usernames : currentDmGroup?.usernames?.[0] || '')) as string;
	}, [currentDmGroup?.channel_label, currentDmGroup?.usernames]);

	const dmAvatar = useMemo(() => {
		return currentDmGroup?.channel_avatar?.[0];
	}, [currentDmGroup?.channel_avatar?.[0]]);

	const userStatus = useMemberStatus(isModeDM ? currentDmGroup?.user_id?.[0] : '');

	const navigateToThreadDetail = useCallback(() => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET, params: { directMessage: currentDmGroup } });
	}, [currentDmGroup, navigation]);

	const handleBack = useCallback(() => {
		if (APP_SCREEN.MESSAGES.NEW_GROUP === from) {
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			return;
		}
		navigation.goBack();
	}, [from, navigation]);

	const goToCall = () => {
		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
			params: {
				receiverId: currentDmGroup?.user_id?.[0],
				receiverAvatar: dmAvatar,
				directMessageId
			}
		});
	};

	const navigateToNotifications = () => {
		navigation.navigate(APP_SCREEN.NOTIFICATION.STACK, {
			screen: APP_SCREEN.NOTIFICATION.HOME
		});
	};

	return (
		<View style={styles.headerWrapper}>
			<Pressable onPress={handleBack} style={styles.backButton}>
				<Icons.ArrowLargeLeftIcon color={themeValue.text} height={size.s_20} width={size.s_20} />
			</Pressable>
			<Pressable style={styles.channelTitle} onPress={navigateToThreadDetail}>
				{isTypeDMGroup ? (
					<View style={styles.groupAvatar}>
						<Icons.GroupIcon width={18} height={18} />
					</View>
				) : (
					<View style={styles.avatarWrapper}>
						{dmAvatar ? (
							<View style={styles.friendAvatar}>
								<ImageNative
									url={createImgproxyUrl(dmAvatar ?? '', { width: 100, height: 100, resizeType: 'fit' })}
									style={{ width: '100%', height: '100%' }}
									resizeMode={'cover'}
								/>
							</View>
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
				{isTabletLandscape && (
					<TouchableOpacity style={styles.iconHeader} onPress={navigateToNotifications}>
						<Icons.Inbox width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
					</TouchableOpacity>
				)}
				{!isTypeDMGroup && !!currentDmGroup?.user_id?.[0] && (
					<TouchableOpacity style={styles.iconHeader} onPress={goToCall}>
						<Icons.PhoneCallIcon width={size.s_18} height={size.s_18} color={themeValue.text} />
					</TouchableOpacity>
				)}
			</Pressable>
		</View>
	);
};

export default React.memo(HeaderDirectMessage);
