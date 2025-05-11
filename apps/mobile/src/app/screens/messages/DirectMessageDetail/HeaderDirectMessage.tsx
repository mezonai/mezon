import { useChatSending, useMemberStatus, useSeenMessagePool } from '@mezon/core';
import { ActionEmitEvent, IOption, Icons } from '@mezon/mobile-components';
import { Colors, size } from '@mezon/mobile-ui';
import {
	MessagesEntity,
	channelsActions,
	directActions,
	directMetaActions,
	selectDmGroupCurrent,
	selectLastMessageByChannelId,
	selectLastSeenMessageStateByChannelId,
	selectMemberClanByUserId2,
	selectPreviousChannels,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { TypeMessage, createImgproxyUrl, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DeviceEventEmitter, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import ImageNative from '../../../components/ImageNative';
import { UserStatus } from '../../../components/UserStatus';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getUserStatusByMetadata } from '../../../utils/helpers';
import { ConfirmBuzzMessageModal } from '../../home/homedrawer/components/ConfirmBuzzMessage';
import { OptionChannelHeader } from '../../home/homedrawer/components/HeaderOptions';
import HeaderTooltip from '../../home/homedrawer/components/HeaderTooltip';

interface HeaderProps {
	from?: string;
	styles: any;
	themeValue: any;
	directMessageId: string;
}
function useChannelSeen(channelId: string, currentDmGroup: any) {
	const dispatch = useAppDispatch();
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

const HeaderDirectMessage: React.FC<HeaderProps> = ({ from, styles, themeValue, directMessageId }) => {
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	useChannelSeen(directMessageId || '', currentDmGroup);
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const user = useSelector((state) => selectMemberClanByUserId2(state, currentDmGroup?.user_id?.[0]));
	const status = getUserStatusByMetadata(user?.user?.metadata);

	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ mode, channelOrDirect: currentDmGroup });
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

	const headerOptions: IOption[] = [
		{
			title: 'buzz',
			content: 'Buzz',
			value: OptionChannelHeader.Buzz,
			icon: <MezonIconCDN icon={IconCDN.buzz} color={Colors.textGray} height={size.s_18} width={size.s_18} />
		}
	];

	const onPressOption = (option: IOption) => {
		if (option?.value === OptionChannelHeader.Buzz) {
			handleActionBuzzMessage();
		}
	};

	const handleActionBuzzMessage = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		const data = {
			children: <ConfirmBuzzMessageModal onSubmit={handleBuzzMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const handleBuzzMessage = (text: string) => {
		sendMessage({ t: text || 'Buzz!!' }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
	};

	return (
		<View style={styles.headerWrapper}>
			<Pressable onPress={handleBack} style={styles.backButton}>
				<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
			</Pressable>
			<Pressable style={styles.channelTitle} onPress={navigateToThreadDetail}>
				{isTypeDMGroup ? (
					<View style={styles.groupAvatar}>
						<MezonIconCDN icon={IconCDN.groupIcon} width={18} height={18} />
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
						<MezonIconCDN icon={IconCDN.phoneCallIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
					</TouchableOpacity>
				)}
				<View style={styles.iconOption}>
					<HeaderTooltip onPressOption={onPressOption} options={headerOptions} />
				</View>
			</Pressable>
		</View>
	);
};

export default React.memo(HeaderDirectMessage);
