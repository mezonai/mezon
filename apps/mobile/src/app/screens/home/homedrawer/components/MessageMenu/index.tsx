import { useFriends } from '@mezon/core';
import { ActionEmitEvent, ENotificationActive, ENotificationChannelId } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import {
	EStateFriend,
	deleteChannel,
	directActions,
	directMetaActions,
	fetchDirectMessage,
	fetchUserChannels,
	getStore,
	markAsReadProcessing,
	notificationSettingActions,
	removeMemberChannel,
	selectAllAccount,
	selectCurrentClanId,
	selectCurrentUserId,
	selectFriendById,
	selectLatestMessageId,
	selectNotifiSettingsEntitiesById,
	selectRawDataUserGroup,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { createImgproxyUrl, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import type { ApiMarkAsReadRequest } from 'mezon-js/api.gen';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import type { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../componentUI/MezonMenu';
import MezonMenu from '../../../../../componentUI/MezonMenu';
import ImageNative from '../../../../../components/ImageNative';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

interface IServerMenuProps {
	// inviteRef: MutableRefObject<any>;
	messageInfo: DirectEntity;
}

function MessageMenu({ messageInfo }: IServerMenuProps) {
	const { t } = useTranslation(['dmMessage']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const currentClanId = useSelector(selectCurrentClanId);
	const userProfile = useSelector(selectAllAccount);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const infoFriend = useAppSelector((state) => selectFriendById(state, messageInfo?.user_ids?.[0] || ''));
	const didIBlockUser = useMemo(() => {
		return (
			infoFriend?.state === EStateFriend.BLOCK &&
			infoFriend?.source_id === userProfile?.user?.id &&
			infoFriend?.user?.id === messageInfo?.user_ids?.[0]
		);
	}, [infoFriend?.source_id, infoFriend?.state, infoFriend?.user?.id, messageInfo?.user_ids, userProfile?.user?.id]);
	const { blockFriend, unBlockFriend, deleteFriend, addFriend } = useFriends();
	const allUserGroupDM = useSelector((state) => selectRawDataUserGroup(state, messageInfo?.channel_id || ''));

	useEffect(() => {
		if (messageInfo?.channel_id) {
			dispatch(fetchUserChannels({ channelId: messageInfo.channel_id, isGroup: true }));
		}
	}, [messageInfo?.channel_id]);

	const dismiss = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	useEffect(() => {
		dispatch(notificationSettingActions.getNotificationSetting({ channelId: messageInfo?.channel_id }));
	}, []);

	const userName: string = useMemo(() => {
		return (
			messageInfo?.channel_label || (typeof messageInfo?.usernames === 'string' ? messageInfo?.usernames : messageInfo?.usernames?.[0] || '')
		);
	}, [messageInfo?.channel_label, messageInfo?.usernames]);

	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, messageInfo?.channel_id || ''));

	const isDmUnmute = useMemo(() => {
		return (
			getNotificationChannelSelected?.active === ENotificationActive.ON || getNotificationChannelSelected?.id === ENotificationChannelId.Default
		);
	}, [getNotificationChannelSelected]);

	const isGroup = useMemo(() => {
		return Number(messageInfo?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [messageInfo?.type]);

	const lastOne = useMemo(() => {
		const userIds = allUserGroupDM?.user_ids || [];
		return userIds?.length === 1;
	}, [allUserGroupDM?.user_ids]);

	const isChatWithMyself = useMemo(() => {
		if (Number(messageInfo?.type) !== ChannelType.CHANNEL_TYPE_DM) return false;
		return messageInfo?.user_ids?.[0] === currentUserId;
	}, [messageInfo?.type, messageInfo?.user_ids, currentUserId]);

	const handleShowModalLeaveGroup = useCallback(async () => {
		dismiss();
		await sleep(500);
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleLeaveGroupConfirm}
					title={t('confirm.title', {
						groupName: messageInfo?.channel_label
					})}
					content={t('confirm.content', {
						groupName: messageInfo?.channel_label
					})}
					confirmText={t('confirm.confirmText')}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [messageInfo?.channel_label, t]);

	const leaveGroupMenu: IMezonMenuItemProps[] = [
		{
			onPress: handleShowModalLeaveGroup,
			isShow: isGroup,
			title: lastOne ? t('menu.deleteGroup') : t('menu.leaveGroup'),
			textStyle: { color: baseColor.redStrong }
		}
	];

	const handleAddFriend = () => {
		const body = messageInfo?.user_ids?.[0] ? { ids: [messageInfo?.user_ids?.[0]] } : { usernames: [messageInfo?.usernames?.[0]] };
		addFriend(body);
		dismiss();
	};

	const handleDeleteFriend = () => {
		deleteFriend(messageInfo?.usernames?.[0], messageInfo?.user_ids?.[0]);
		dismiss();
	};

	const handleBlockFriend = async () => {
		try {
			const isBlocked = await blockFriend(messageInfo?.usernames?.[0], messageInfo?.user_ids?.[0]);
			if (isBlocked) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('notification.blockUser.success'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					}
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('notification.blockUser.error')
				}
			});
		} finally {
			dismiss();
		}
	};

	const handleUnblockFriend = async () => {
		try {
			const isUnblocked = await unBlockFriend(messageInfo?.usernames?.[0], messageInfo?.user_ids?.[0]);
			if (isUnblocked) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('notification.unblockUser.success'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} width={20} height={20} />
					}
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('notification.unblockUser.error'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} width={20} height={20} />
				}
			});
		} finally {
			dismiss();
		}
	};

	const profileMenu: IMezonMenuItemProps[] = [
		{
			onPress: async () => {
				await dispatch(directActions.closeDirectMessage({ channel_id: messageInfo?.channel_id }));
				await dispatch(directActions.setDmGroupCurrentId(''));
				dismiss();
			},
			title: t('menu.closeDm'),
			isShow: !isGroup,
			icon: <MezonIconCDN icon={IconCDN.closeDMIcon} color={themeValue.textStrong} customStyle={{ marginBottom: size.s_4 }} />,
			textStyle: styles.menuTextMarginLeft
		},
		{
			onPress: infoFriend?.state === EStateFriend.FRIEND ? handleDeleteFriend : handleAddFriend,
			title: infoFriend?.state === EStateFriend.FRIEND ? t('menu.removeFriend') : t('menu.addFriend'),
			isShow:
				!isGroup &&
				infoFriend?.state !== EStateFriend.BLOCK &&
				infoFriend?.state !== EStateFriend.MY_PENDING &&
				infoFriend?.state !== EStateFriend.OTHER_PENDING &&
				!isChatWithMyself,
			icon:
				infoFriend?.state === EStateFriend.FRIEND ? (
					<MezonIconCDN icon={IconCDN.removeFriend} color={themeValue.textStrong} customStyle={{ marginBottom: size.s_2 }} />
				) : (
					<MezonIconCDN icon={IconCDN.userPlusIcon} color={themeValue.textStrong} customStyle={{ marginBottom: size.s_2 }} />
				)
		},
		{
			onPress: didIBlockUser ? handleUnblockFriend : handleBlockFriend,
			title: didIBlockUser ? t('menu.unblockUser') : t('menu.blockUser'),
			isShow: !isGroup && (infoFriend?.state === EStateFriend.FRIEND || didIBlockUser) && !isChatWithMyself,
			icon: didIBlockUser ? (
				<MezonIconCDN icon={IconCDN.unblockUser} color={themeValue.textStrong} />
			) : (
				<MezonIconCDN icon={IconCDN.blockUser} color={themeValue.textStrong} />
			)
		}
	];

	const handleMarkAsRead = async (channel_id: string) => {
		if (!channel_id) return;
		const timestamp = Date.now() / 1000;
		const store = getStore();
		const messageId = store ? selectLatestMessageId(store.getState(), channel_id) : undefined;
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: channel_id, timestamp, messageId }));

		const body: ApiMarkAsReadRequest = {
			clan_id: '',
			category_id: '',
			channel_id
		};
		try {
			await dispatch(markAsReadProcessing(body));
		} catch (error) {
			console.error('Failed to mark as read:', error);
		} finally {
			dismiss();
		}
	};

	const markAsReadMenu: IMezonMenuItemProps[] = [
		{
			onPress: async () => await handleMarkAsRead(messageInfo?.channel_id ?? ''),
			title: t('menu.markAsRead'),
			icon: <MezonIconCDN icon={IconCDN.eyeIcon} color={themeValue.textStrong} />,
			isShow: !isChatWithMyself
		}
	];

	const muteOrUnMuteChannel = async (active: ENotificationActive) => {
		const body = {
			channel_id: messageInfo?.channel_id || '',
			notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
			clan_id: currentClanId || '',
			active
		};
		const response = await dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		if (response?.meta?.requestStatus === 'fulfilled') {
			dispatch(notificationSettingActions.updateNotiState({ channelId: messageInfo?.channel_id || '', active }));
		}
	};

	const optionsMenu: IMezonMenuItemProps[] = [
		{
			title: isDmUnmute ? t('menu.muteConversation') : t('menu.unMuteConversation'),
			onPress: () => {
				if (!isDmUnmute) {
					muteOrUnMuteChannel(ENotificationActive.ON);
				} else {
					navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
						screen: APP_SCREEN.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL,
						params: { currentChannel: messageInfo, isCurrentChannel: false }
					});
				}
				dismiss();
			},
			icon: isDmUnmute ? (
				<MezonIconCDN icon={IconCDN.bellIcon} color={themeValue.textStrong} />
			) : (
				<MezonIconCDN icon={IconCDN.bellSlashIcon} color={themeValue.textStrong} />
			),
			isShow: !isChatWithMyself
		}
	];

	const menu: IMezonMenuSectionProps[] = [
		{
			items: leaveGroupMenu
		},
		{
			items: profileMenu
		},
		{
			items: markAsReadMenu
		},
		{
			items: optionsMenu
		}
	];

	const handleLeaveGroupConfirm = useCallback(async () => {
		const isLeaveOrDeleteGroup = lastOne
			? await dispatch(deleteChannel({ clanId: '0', channelId: messageInfo?.channel_id ?? '', isDmGroup: true }))
			: await dispatch(removeMemberChannel({ channelId: messageInfo?.channel_id || '', userIds: [currentUserId], kickMember: false }));
		if (!isLeaveOrDeleteGroup) {
			return;
		}
		dispatch(directActions.setDmGroupCurrentId(''));

		await dispatch(fetchDirectMessage({ noCache: true }));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, [currentUserId, dispatch, lastOne, messageInfo?.channel_id]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				{isGroup ? (
					messageInfo?.channel_avatar && !messageInfo?.channel_avatar?.includes('avatar-group.png') ? (
						<View style={styles.groupAvatarContainer}>
							<ImageNative
								url={createImgproxyUrl(messageInfo?.channel_avatar ?? '')}
								style={styles.imageFullSize}
								resizeMode={'cover'}
							/>
						</View>
					) : (
						<View style={styles.groupAvatar}>
							<MezonIconCDN icon={IconCDN.groupIcon} />
						</View>
					)
				) : (
					<View style={styles.avatarWrapper}>
						{messageInfo?.avatars?.[0] ? (
							<FastImage
								source={{
									uri: createImgproxyUrl(messageInfo?.avatars?.[0] ?? '', { width: 100, height: 100, resizeType: 'fit' })
								}}
								style={styles.friendAvatar}
							/>
						) : (
							<View style={styles.wrapperTextAvatar}>
								<Text style={styles.textAvatar}>{userName?.charAt?.(0)?.toUpperCase()}</Text>
							</View>
						)}
					</View>
				)}
				<View style={styles.titleWrapper}>
					<Text style={styles.serverName} numberOfLines={2}>
						{userName}
					</Text>
					{isGroup && messageInfo?.member_count > 0 && (
						<Text style={styles.memberText}>
							{messageInfo?.member_count} {t('members')}
						</Text>
					)}
				</View>
			</View>

			<View>
				<MezonMenu menu={menu} />
			</View>
		</View>
	);
}

export default memo(MessageMenu);
