import { useSeenMessagePool } from '@mezon/core';
import { IUserStatus, Icons } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import {
	MessagesEntity,
	channelsActions,
	directActions,
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
import React, { useEffect, useRef } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import { UserStatus } from '../../../components/UserStatus';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getUserStatusByMetadata } from '../../../utils/helpers';

interface HeaderProps {
	handleBack: () => void;
	navigateToThreadDetail: () => void;
	isTypeDMGroup: boolean;
	dmAvatar: string | null;
	dmLabel: string;
	userStatus: IUserStatus;
	styles: any;
	themeValue: any;
	directMessageId: string;
	firstUserId: string;
}
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
		const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
		if (lastMessage) {
			markAsReadSeen(lastMessage, mode);
		}
	}, [lastMessage, channelId, currentDmGroup?.type, markAsReadSeen]);

	useEffect(() => {
		if (lastMessage) {
			const timestamp = Date.now() / 1000;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId, timestamp: timestamp + TIME_OFFSET }));
			dispatch(directMetaActions.updateLastSeenTime(lastMessage));
			dispatch(channelsActions.updateChannelBadgeCount({ clanId: '0', channelId: channelId || '', count: 0, isReset: true }));
			updateChannelSeenState(channelId, lastMessage);
		}
	}, [lastMessage]);

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

const HeaderDirectMessage: React.FC<HeaderProps> = ({
	handleBack,
	navigateToThreadDetail,
	isTypeDMGroup,
	dmAvatar,
	dmLabel,
	userStatus,
	styles,
	themeValue,
	directMessageId,
	firstUserId
}) => {
	useChannelSeen(directMessageId || '');
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const user = useSelector((state) => selectMemberClanByUserId2(state, firstUserId));
	const status = getUserStatusByMetadata(user?.user?.metadata);

	const goToCall = () => {
		navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
			screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
			params: {
				receiverId: firstUserId,
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
							<FastImage
								source={{
									uri: createImgproxyUrl(dmAvatar ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
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
				{isTabletLandscape && (
					<TouchableOpacity style={styles.iconHeader} onPress={navigateToNotifications}>
						<Icons.Inbox width={size.s_20} height={size.s_20} color={themeValue.textStrong} />
					</TouchableOpacity>
				)}
				{!isTypeDMGroup && !!firstUserId && (
					<TouchableOpacity style={styles.iconHeader} onPress={goToCall}>
						<Icons.PhoneCallIcon width={size.s_18} height={size.s_18} color={themeValue.text} />
					</TouchableOpacity>
				)}
			</Pressable>
		</View>
	);
};

export default React.memo(HeaderDirectMessage);
