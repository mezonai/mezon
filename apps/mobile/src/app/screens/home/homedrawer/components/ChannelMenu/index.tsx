import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useMarkAsRead, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, ENotificationActive, ENotificationChannelId } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	channelUsersActions,
	channelsActions,
	fetchSystemMessageByClanId,
	listChannelRenderAction,
	notificationSettingActions,
	selectAllChannelsFavorite,
	selectClanSystemMessage,
	selectCurrentClan,
	selectCurrentUserId,
	selectNotifiSettingsEntitiesById,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelThreads, EOverriddenPermission, EPermission, sleep } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../app/navigation/ScreenTypes';
import MezonClanAvatar from '../../../../../componentUI/MezonClanAvatar';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../componentUI/MezonMenu';
import NotificationSetting from '../../../../../components/NotificationSetting';
import { style } from './styles';

interface IChannelMenuProps {
	channel: ChannelThreads;
}

type StackMenuClanScreen = typeof APP_SCREEN.MENU_CHANNEL.STACK;
export default function ChannelMenu({ channel }: IChannelMenuProps) {
	const { t } = useTranslation(['channelMenu']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	// const { setOpenThreadMessageState } = useReference();
	const currentClan = useSelector(selectCurrentClan);
	const dispatch = useAppDispatch();
	const [isCanManageThread, isCanManageChannel] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel],
		channel?.channel_id ?? ''
	);
	const currentSystemMessage = useSelector(selectClanSystemMessage);

	useEffect(() => {
		dispatch(notificationSettingActions.getNotificationSetting({ channelId: channel?.channel_id }));
		dispatch(fetchSystemMessageByClanId({ clanId: channel?.clan_id }));
	}, []);

	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, channel?.channel_id || ''));

	const currentUserId = useSelector(selectCurrentUserId);

	const isStreamOrVoiceChannel = channel?.type === ChannelType.CHANNEL_TYPE_STREAMING || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE;

	const isChannelUnmute = useMemo(() => {
		return (
			getNotificationChannelSelected?.active === ENotificationActive.ON || getNotificationChannelSelected?.id === ENotificationChannelId.Default
		);
	}, [getNotificationChannelSelected]);
	const isChannel = useMemo(() => {
		return channel?.type !== ChannelType.CHANNEL_TYPE_THREAD;
	}, [channel?.type]);
	const favoriteChannel = useSelector(selectAllChannelsFavorite);
	const isFavorite = useMemo(() => {
		if (favoriteChannel && favoriteChannel?.length > 0) {
			return favoriteChannel?.some((channelId) => channelId === channel?.id);
		}
		return false;
	}, [favoriteChannel, channel?.id]);

	const { dismiss } = useBottomSheetModal();

	const navigation = useNavigation<AppStackScreenProps<StackMenuClanScreen>['navigation']>();
	const { handleMarkAsReadChannel } = useMarkAsRead();

	const handleMarkAsRead = useCallback(() => {
		handleMarkAsReadChannel(channel);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	}, [channel, handleMarkAsReadChannel]);

	const handleCopyLink = () => {
		Clipboard.setString(process.env.NX_CHAT_APP_REDIRECT_URI + `/chat/clans/${channel?.clan_id}/channels/${channel?.channel_id}`);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const watchMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.watchMenu.markAsRead'),
			onPress: () => handleMarkAsRead(),
			icon: <MezonIconCDN icon={IconCDN.eyeIcon} color={themeValue.textStrong} />,
			isShow: !isStreamOrVoiceChannel
		}
	];

	const inviteMenu: IMezonMenuItemProps[] = [
		{
			title: isFavorite ? t('menu.inviteMenu.unMarkFavorite') : t('menu.inviteMenu.markFavorite'),
			onPress: () => {
				isFavorite ? removeFavoriteChannel() : markFavoriteChannel();
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			},
			icon: (
				<MezonIconCDN
					icon={IconCDN.favoriteFilledIcon}
					color={themeValue.textStrong}
					width={30}
					height={30}
					customStyle={{ marginLeft: -size.s_2, marginBottom: size.s_2 }}
				/>
			),
			textStyle: { marginLeft: -size.s_2 }
		},
		{
			title: t('menu.inviteMenu.copyLink'),
			onPress: () => handleCopyLink(),
			icon: <MezonIconCDN icon={IconCDN.linkIcon} color={themeValue.textStrong} />
		}
	];

	const markFavoriteChannel = () => {
		dispatch(channelsActions.addFavoriteChannel({ channel_id: channel?.id, clan_id: currentClan?.id }));
		dispatch(listChannelRenderAction.handleMarkFavor({ channelId: channel?.id, clanId: currentClan?.id as string, mark: true }));
	};

	const removeFavoriteChannel = () => {
		dispatch(channelsActions.removeFavoriteChannel({ channelId: channel?.id, clanId: currentClan?.id || '' }));
		dispatch(listChannelRenderAction.handleMarkFavor({ channelId: channel?.id, clanId: currentClan?.id as string, mark: false }));
	};

	const muteOrUnMuteChannel = (active: ENotificationActive) => {
		const body = {
			channel_id: channel?.channel_id || '',
			notification_type: getNotificationChannelSelected?.notification_setting_type || 0,
			clan_id: currentClan?.clan_id || '',
			active
		};
		dispatch(notificationSettingActions.setMuteNotificationSetting(body));
	};

	const handleConfirmLeaveChannel = useCallback(async () => {
		try {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			dispatch(appActions.setLoadingMainMobile(true));
			const body = {
				channelId: channel.id,
				userId: currentUserId,
				channelType: channel.type,
				clanId: channel.clan_id
			};
			const response = await dispatch(channelUsersActions.removeChannelUsers(body));
			if (response?.meta?.requestStatus === 'rejected') {
				throw new Error(response?.meta?.requestStatus);
			}
			navigation.navigate(APP_SCREEN.HOME);
		} catch (error) {
			Toast.show({ type: 'error', text1: t('modalConFirmLeaveChannel.error', { error }) });
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [channel?.channel_private, channel?.clan_id, channel?.id, channel?.type, currentUserId]);

	const handlePressLeaveChannel = () => {
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleConfirmLeaveChannel}
					title={t('modalConFirmLeaveChannel.title')}
					confirmText={t('modalConFirmLeaveChannel.yesButton')}
					content={t('modalConFirmLeaveChannel.textConfirm')}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const notificationMenu: IMezonMenuItemProps[] = [
		{
			title: isChannel
				? `${isChannelUnmute ? t('menu.notification.muteChannel') : t('menu.notification.unMuteChannel')}`
				: `${isChannelUnmute ? t('menu.notification.muteThread') : t('menu.notification.unMuteThread')}`,
			onPress: () => {
				if (!isChannelUnmute) {
					muteOrUnMuteChannel(ENotificationActive.ON);
				} else {
					navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
						screen: APP_SCREEN.MENU_THREAD.MUTE_THREAD_DETAIL_CHANNEL,
						params: { currentChannel: channel, isCurrentChannel: false }
					});
				}
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			},
			icon: isChannelUnmute ? (
				<MezonIconCDN icon={IconCDN.bellIcon} color={themeValue.textStrong} />
			) : (
				<MezonIconCDN icon={IconCDN.bellSlashIcon} color={themeValue.text} />
			),
			isShow: true
		},
		{
			title: t('menu.notification.notification'),
			onPress: () => {
				const data = {
					snapPoints: ['50%'],
					children: <NotificationSetting channel={channel} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			},
			icon: <MezonIconCDN icon={IconCDN.channelNotificaitionIcon} color={themeValue.textStrong} />,
			isShow: true
		}
	];

	const threadMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.thread.threads'),
			onPress: () => {
				dismiss();
				dispatch(threadsActions.setOpenThreadMessageState(false));
				navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
					screen: APP_SCREEN.MENU_THREAD.CREATE_THREAD,
					params: { channelThreads: channel }
				});
			},
			icon: <MezonIconCDN icon={IconCDN.threadIcon} color={themeValue.textStrong} />,
			isShow: !isStreamOrVoiceChannel
		}
	];

	const organizationMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.organizationMenu.edit'),
			onPress: () => {
				dismiss();
				navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
					screen: APP_SCREEN.MENU_CHANNEL.SETTINGS,
					params: {
						channelId: channel?.channel_id
					}
				});
			},
			icon: <MezonIconCDN icon={IconCDN.settingIcon} color={themeValue.textStrong} />,
			isShow: isCanManageChannel
		},
		{
			title: t('menu.organizationMenu.deleteChannel'),
			icon: <MezonIconCDN icon={IconCDN.closeSmallBold} color={baseColor.redStrong} />,
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					children: (
						<MezonConfirm
							onConfirm={handleConfirmDeleteChannel}
							title={t('modalConfirm.channel.title', { channelName: channel?.channel_label })}
							confirmText={t('modalConfirm.channel.confirmText')}
							content={t('modalConfirm.channel.content')}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			},
			textStyle: {
				color: baseColor.redStrong
			},
			isShow: isCanManageChannel
		},
		{
			title: t('menu.organizationMenu.leaveChannel'),
			icon: <MezonIconCDN icon={IconCDN.leaveGroupIcon} color={baseColor.redStrong} />,
			onPress: handlePressLeaveChannel,
			textStyle: {
				color: baseColor.redStrong
			},
			isShow: channel?.creator_id !== currentUserId && channel?.channel_private === 1
		}
	];

	const manageThreadMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.manageThreadMenu.leaveThread'),
			icon: <MezonIconCDN icon={IconCDN.leaveGroupIcon} color={baseColor.redStrong} />,
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					children: (
						<MezonConfirm
							onConfirm={handleConfirmLeaveThread}
							title={t('modalConFirmLeaveThread.title')}
							confirmText={t('modalConFirmLeaveThread.yesButton')}
							content={t('modalConFirmLeaveThread.textConfirm')}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			},
			textStyle: {
				color: baseColor.redStrong
			},
			isShow: channel?.creator_id !== currentUserId
		},
		// {
		// 	title: t('menu.manageThreadMenu.closeThread'),
		// 	icon: <MezonIconCDN icon={IconCDN.closeSmallBold} color={themeValue.textStrong} />,
		// 	onPress: () => reserve(),
		// 	isShow: isCanManageThread
		// },
		// {
		// 	title: t('menu.manageThreadMenu.lockThread'),
		// 	icon: <MezonIconCDN icon={IconCDN.lockIcon} color={themeValue.textStrong} />,
		// 	onPress: () => reserve(),
		// 	isShow: isCanManageThread
		// },
		{
			title: t('menu.manageThreadMenu.editThread'),
			icon: <MezonIconCDN icon={IconCDN.pencilIcon} color={themeValue.textStrong} />,
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
					screen: APP_SCREEN.MENU_CHANNEL.SETTINGS,
					params: {
						channelId: channel?.channel_id
					}
				});
			},
			isShow: channel?.creator_id === currentUserId || isCanManageThread
		},
		{
			title: t('menu.manageThreadMenu.deleteThread'),
			icon: <MezonIconCDN icon={IconCDN.trashIcon} color={baseColor.redStrong} />,
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					children: (
						<MezonConfirm
							onConfirm={handleConfirmDeleteChannel}
							title={t('modalConfirm.thread.title', { threadName: channel?.channel_label })}
							confirmText={t('modalConfirm.thread.confirmText')}
							content={t('modalConfirm.thread.content')}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			},
			textStyle: {
				color: baseColor.redStrong
			},
			isShow: channel?.creator_id === currentUserId || isCanManageThread
		}
	];

	const mainChannelMenu: IMezonMenuSectionProps[] = [
		{
			items: watchMenu
		},
		{
			items: inviteMenu
		},
		{
			items: notificationMenu
		},
		{
			items: threadMenu
		},
		{
			items: organizationMenu
		}
	];

	const mainThreadMenu: IMezonMenuSectionProps[] = [
		{
			items: watchMenu
		},
		{
			items: manageThreadMenu
		},
		{
			items: notificationMenu
		}
	];

	const handleConfirmDeleteChannel = useCallback(async () => {
		try {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			dispatch(appActions.setLoadingMainMobile(true));
			if (channel?.channel_id === currentSystemMessage?.channel_id) {
				Toast.show({ type: 'error', text1: t('modalConfirm.channel.systemChannel') });
			} else {
				const response = await dispatch(
					channelsActions.deleteChannel({ channelId: channel?.channel_id || '', clanId: channel?.clan_id || '' })
				);
				if (response?.meta?.requestStatus === 'rejected') {
					throw response?.error?.message;
				}
			}
		} catch (error) {
			Toast.show({ type: 'error', text1: t('modalConfirm.channel.error', { error }) });
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [dispatch, channel?.channel_id, channel?.clan_id, currentSystemMessage?.channel_id, t]);

	const handleConfirmLeaveThread = useCallback(async () => {
		await dispatch(
			threadsActions.leaveThread({
				clanId: currentClan?.id || '',
				channelId: channel?.parent_id || '',
				threadId: channel?.id || '',
				isPrivate: channel.channel_private || 0
			})
		);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, [channel?.channel_private, channel?.id, channel?.parent_id, currentClan?.id, dispatch]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.avatarWrapper}>
					<MezonClanAvatar alt={currentClan?.clan_name} image={currentClan?.logo} defaultColor={baseColor.blurple} />
				</View>
				<Text style={styles.serverName}>{channel?.channel_label}</Text>
			</View>

			<View style={{ flex: 1 }}>
				<MezonMenu menu={isChannel ? mainChannelMenu : mainThreadMenu} />
			</View>
		</View>
	);
}
