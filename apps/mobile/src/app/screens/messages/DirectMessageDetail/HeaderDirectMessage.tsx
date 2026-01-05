import type { CallSignalingData } from '@mezon/components';
import { useChatSending, useSeenMessagePool } from '@mezon/core';
import type { IOption } from '@mezon/mobile-components';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import {
	DMCallActions,
	directMetaActions,
	getStore,
	groupCallActions,
	messagesActions,
	selectAllAccount,
	selectCurrentUserId,
	selectDmGroupCurrent,
	selectLastMessageByChannelId,
	selectLastSentMessageStateByChannelId,
	selectRawDataUserGroup,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { IMessageTypeCallLog, TypeMessage, WEBRTC_SIGNALING_TYPES, createImgproxyUrl } from '@mezon/utils';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { BackHandler, DeviceEventEmitter, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { useSendSignaling } from '../../../components/CallingGroupModal';
import ImageNative from '../../../components/ImageNative';
import { MemberInvoiceStatus } from '../../../components/MemberStatus/MemberInvoiceStatus';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { ConfirmBuzzMessageModal } from '../../home/homedrawer/components/ConfirmBuzzMessage';
import { OptionChannelHeader } from '../../home/homedrawer/components/HeaderOptions';
import HeaderTooltip from '../../home/homedrawer/components/HeaderTooltip';
import { DirectMessageCallMain } from '../DirectMessageCall';
import { UserStatusDM } from '../UserStatusDM';

interface HeaderProps {
	from?: string;
	styles: any;
	themeValue: any;
	directMessageId: string;
	isBlocked?: boolean;
}
export const ChannelSeen = memo(({ channelId }: { channelId: string }) => {
	const dispatch = useAppDispatch();
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));
	const lastMessageState = useSelector((state) => selectLastSentMessageStateByChannelId(state, channelId as string));

	const { markAsReadSeen } = useSeenMessagePool();

	const markMessageAsRead = useCallback(() => {
		if (!lastMessage) return;

		if (
			lastMessage?.createTimeSeconds &&
			lastMessageState?.timestampSeconds &&
			lastMessage?.createTimeSeconds >= lastMessageState?.timestampSeconds
		) {
			const mode =
				currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;

			markAsReadSeen(lastMessage, mode, 0);
		}
	}, [lastMessage, lastMessageState?.timestampSeconds, currentDmGroup?.type, markAsReadSeen]);

	useEffect(() => {
		if (lastMessage) {
			dispatch(directMetaActions.updateLastSeenTime(lastMessage));
			markMessageAsRead();
		}
	}, [lastMessage, markMessageAsRead, dispatch, channelId]);
	return null;
});

const HeaderDirectMessage: React.FC<HeaderProps> = ({ from, styles, themeValue, directMessageId, isBlocked }) => {
	const currentDmGroup = useSelector(selectDmGroupCurrent(directMessageId ?? ''));
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const { sendSignalingToParticipants } = useSendSignaling();

	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ mode, channelOrDirect: currentDmGroup });
	const isTypeDMGroup = useMemo(() => {
		return Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [currentDmGroup?.type]);
	const currentUserId = useSelector(selectCurrentUserId);

	const isChatWithMyself = useMemo(() => {
		if (Number(currentDmGroup?.type) !== ChannelType.CHANNEL_TYPE_DM) return false;
		return currentDmGroup?.userIds?.[0] === currentUserId;
	}, [currentDmGroup?.type, currentDmGroup?.userIds, currentUserId]);

	const dmLabel = useMemo(() => {
		return (currentDmGroup?.channelLabel ||
			(typeof currentDmGroup?.usernames === 'string' ? currentDmGroup?.usernames : currentDmGroup?.usernames?.[0] || '')) as string;
	}, [currentDmGroup?.channelLabel, currentDmGroup?.usernames]);

	const dmAvatar = useMemo(() => {
		return currentDmGroup?.avatars?.[0];
	}, [currentDmGroup?.avatars?.[0]]);

	const navigateToThreadDetail = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false
		});
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, { screen: APP_SCREEN.MENU_THREAD.BOTTOM_SHEET, params: { directMessage: currentDmGroup } });
	}, [currentDmGroup, navigation]);

	const handleBack = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false
		});
		if (APP_SCREEN.MESSAGES.NEW_GROUP === from) {
			navigation.navigate(APP_SCREEN.MESSAGES.HOME);
		} else {
			navigation.goBack();
		}
		return true;
	}, [from, navigation]);

	useFocusEffect(
		useCallback(() => {
			const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);

			return () => backHandler.remove();
		}, [])
	);

	const goToCall = (isVideo = false) => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
			isShow: false
		});
		if (isTypeDMGroup) {
			const store = getStore();
			const state = store.getState();
			const rawDataUserGroup = selectRawDataUserGroup(state, currentDmGroup.channelId);
			const data = {
				channelId: currentDmGroup.channelId || '',
				roomName: currentDmGroup?.meeting_code,
				clanId: '',
				isGroupCall: true,
				participantsCount: rawDataUserGroup?.userIds?.length || 0
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, data);

			const userProfile = selectAllAccount(state);
			dispatch(
				groupCallActions.showPreCallInterface({
					groupId: currentDmGroup?.channelId,
					isVideo: false
				})
			);
			const callOfferAction = {
				is_video: false,
				groupId: currentDmGroup?.channelId,
				group_name: currentDmGroup?.channelLabel,
				group_avatar: currentDmGroup?.channel_avatar,
				caller_id: userProfile?.user?.id,
				caller_name: userProfile?.user?.displayName || userProfile?.user?.username || '',
				caller_avatar: userProfile?.user?.avatarUrl,
				meeting_code: currentDmGroup?.meeting_code,
				clanId: '',
				timestamp: Date.now(),
				participants: rawDataUserGroup?.userIds || []
			};
			sendSignalingToParticipants(
				rawDataUserGroup?.userIds || [],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_OFFER,
				callOfferAction as CallSignalingData,
				currentDmGroup?.channelId || '',
				userProfile?.user?.id || ''
			);
			dispatch(
				messagesActions.sendMessage({
					channelId: currentDmGroup?.channelId,
					clanId: '',
					mode: ChannelStreamMode.STREAM_MODE_GROUP,
					isPublic: true,
					content: {
						t: `Started voice call`,
						callLog: {
							isVideo: false,
							callLogType: IMessageTypeCallLog.STARTCALL,
							showCallBack: false
						}
					},
					anonymous: false,
					senderId: userProfile?.user?.id || '',
					avatar: userProfile?.user?.avatarUrl || '',
					isMobile: true,
					username: currentDmGroup?.channelLabel || ''
				})
			);
			return;
		}
		dispatch(DMCallActions.removeAll());
		const params = {
			receiverId: currentDmGroup?.userIds?.[0],
			receiverAvatar: dmAvatar,
			receiverName: dmLabel,
			directMessageId,
			isVideoCall: isVideo
		};
		const dataModal = {
			children: <DirectMessageCallMain route={{ params }} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data: dataModal });
	};

	const headerOptions: IOption[] = [
		{
			title: 'buzz',
			content: 'Buzz',
			value: OptionChannelHeader.Buzz,
			icon: <MezonIconCDN icon={IconCDN.buzz} color={themeValue.textStrong} height={size.s_18} width={size.s_18} />
		}
	];

	const onPressOption = (option: IOption) => {
		if (option?.value === OptionChannelHeader.Buzz) {
			handleActionBuzzMessage();
		}
	};

	const handleActionBuzzMessage = async () => {
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
			<ChannelSeen channelId={directMessageId || ''} />
			{!isTabletLandscape && (
				<Pressable onPress={handleBack} style={styles.backButton}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={themeValue.text} height={size.s_20} width={size.s_20} />
				</Pressable>
			)}
			<Pressable style={styles.channelTitle} onPress={navigateToThreadDetail}>
				{isTypeDMGroup ? (
					currentDmGroup?.channel_avatar && !currentDmGroup?.channel_avatar?.includes('avatar-group.png') ? (
						<View style={styles.groupAvatarWrapper}>
							<ImageNative
								url={createImgproxyUrl(currentDmGroup?.channel_avatar ?? '')}
								style={styles.imageFullSize}
								resizeMode={'cover'}
							/>
						</View>
					) : (
						<View style={styles.groupAvatar}>
							<MezonIconCDN icon={IconCDN.groupIcon} width={18} height={18} />
						</View>
					)
				) : (
					<View style={styles.avatarWrapper}>
						{dmAvatar ? (
							<View style={styles.friendAvatar}>
								<ImageNative
									url={createImgproxyUrl(dmAvatar ?? '', { width: 100, height: 100, resizeType: 'fit' })}
									style={styles.imageFullSize}
									resizeMode={'cover'}
								/>
							</View>
						) : (
							<View style={styles.wrapperTextAvatar}>
								<Text style={[styles.textAvatar]}>{dmLabel?.charAt?.(0)?.toUpperCase()}</Text>
							</View>
						)}
						<UserStatusDM isOnline={currentDmGroup?.onlines?.some(Boolean)} userId={currentDmGroup?.userIds?.[0]} />
					</View>
				)}
				<View style={{ flex: 1 }}>
					<Text style={styles.titleText} numberOfLines={1}>
						{dmLabel}
					</Text>
					{!isTypeDMGroup && <MemberInvoiceStatus userId={currentDmGroup?.userIds?.[0] || ''} />}
				</View>
				{!isBlocked && (
					<View style={styles.iconWrapper}>
						{!isChatWithMyself && (
							<>
								{((!isTypeDMGroup && !!currentDmGroup?.userIds?.[0]) || (isTypeDMGroup && !!currentDmGroup?.meeting_code)) && (
									<TouchableOpacity style={styles.iconHeader} onPress={() => goToCall()}>
										<MezonIconCDN icon={IconCDN.phoneCallIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
									</TouchableOpacity>
								)}
								{!isTypeDMGroup && (
									<TouchableOpacity style={styles.iconHeader} onPress={() => goToCall(true)}>
										<MezonIconCDN icon={IconCDN.videoIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
									</TouchableOpacity>
								)}
							</>
						)}

						<View style={styles.iconOption}>
							<HeaderTooltip onPressOption={onPressOption} options={headerOptions} />
						</View>
					</View>
				)}
			</Pressable>
		</View>
	);
};

export default React.memo(HeaderDirectMessage);
