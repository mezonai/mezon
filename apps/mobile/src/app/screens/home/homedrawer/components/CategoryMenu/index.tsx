import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useMarkAsRead, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	categoriesActions,
	channelsActions,
	defaultNotificationCategoryActions,
	fetchSystemMessageByClanId,
	selectClanSystemMessage,
	selectCurrentChannelId,
	selectCurrentClan,
	useAppDispatch
} from '@mezon/store-mobile';
import { EPermission, ICategoryChannel, sleep } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
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
import CategoryNotificationSetting from '../../../../../components/CategoryNotificationSetting';
import InviteToChannel from '../InviteToChannel';
import { style } from './styles';

enum StatusMarkAsReadCategory {
	Error = 'error',
	Success = 'success',
	Idle = 'idle',
	Pending = 'pending'
}
interface ICategoryMenuProps {
	category: ICategoryChannel;
}

type StackMenuClanScreen = typeof APP_SCREEN.MENU_CLAN.STACK;
export default function CategoryMenu({ category }: ICategoryMenuProps) {
	const { t } = useTranslation(['categoryMenu']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentClan = useSelector(selectCurrentClan);
	const currentChanelId = useSelector(selectCurrentChannelId);
	const [isCanManageChannel, isCanManageClan] = usePermissionChecker([EPermission.manageChannel, EPermission.manageClan], currentChanelId ?? '');
	const navigation = useNavigation<AppStackScreenProps<StackMenuClanScreen>['navigation']>();
	const { handleMarkAsReadCategory, statusMarkAsReadCategory } = useMarkAsRead();
	const { dismiss } = useBottomSheetModal();
	const dispatch = useAppDispatch();
	const currentSystemMessage = useSelector(selectClanSystemMessage);

	const isHasSystemChannel = useMemo(() => {
		return category?.channels?.some((channel) => channel === currentSystemMessage?.channel_id);
	}, [category?.channels, currentSystemMessage?.channel_id]);

	const handleRemoveCategory = useCallback(() => {
		try {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			dispatch(appActions.setLoadingMainMobile(true));
			if (isHasSystemChannel) {
				Toast.show({ type: 'error', text1: t('menu.toast.systemChannel', { categoryName: category?.category_name }) });
				return;
			}
			dispatch(
				categoriesActions.deleteCategory({
					clanId: category?.clan_id as string,
					categoryId: category?.id as string,
					categoryLabel: category?.category_name as string
				})
			);
			dispatch(channelsActions.fetchChannels({ clanId: category?.clan_id, noCache: true, isMobile: true }));
		} catch (error) {
			Toast.show({ type: 'error', text1: t('menu.toast.error', { error }) });
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [category?.category_name, category?.clan_id, category?.id, dispatch, isHasSystemChannel]);

	const handleMarkAsRead = useCallback(async () => {
		handleMarkAsReadCategory(category);
	}, [category, handleMarkAsReadCategory]);

	useEffect(() => {
		dispatch(appActions.setLoadingMainMobile(statusMarkAsReadCategory === StatusMarkAsReadCategory.Pending));
	}, [dispatch, statusMarkAsReadCategory]);

	useEffect(() => {
		dispatch(defaultNotificationCategoryActions.getDefaultNotificationCategory({ categoryId: category?.id, clanId: category?.clan_id }));
		dispatch(fetchSystemMessageByClanId({ clanId: category.clan_id }));
	}, []);

	const openBottomSheet = () => {
		const data = {
			heightFitContent: true,
			children: <CategoryNotificationSetting category={category} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	const watchMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.watchMenu.markAsRead'),
			onPress: handleMarkAsRead,
			icon: <MezonIconCDN icon={IconCDN.eyeIcon} color={themeValue.textStrong} />
		}
	];

	const handleDelete = async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		const data = {
			children: (
				<MezonConfirm
					onConfirm={handleRemoveCategory}
					title={t('menu.modalConfirm.title')}
					confirmText={t('menu.modalConfirm.confirmText')}
					content={t('menu.modalConfirm.content')}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	};

	const handleMuteCategory = () => {
		navigation.navigate(APP_SCREEN.MENU_THREAD.STACK, {
			screen: APP_SCREEN.MENU_THREAD.MUTE_CATEGORY_DETAIL,
			params: { currentCategory: category }
		});
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const inviteMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.inviteMenu.invite'),
			onPress: () => {
				const data = {
					snapPoints: ['70%', '90%'],
					children: <InviteToChannel isUnknownChannel={false} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			},
			icon: <MezonIconCDN icon={IconCDN.groupPlusIcon} color={themeValue.textStrong} />
		}
	];

	const notificationMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.notification.muteCategory'),
			onPress: handleMuteCategory,
			icon: <MezonIconCDN icon={IconCDN.bellSlashIcon} color={themeValue.textStrong} />
		},
		{
			title: t('menu.notification.notification'),
			onPress: openBottomSheet,
			icon: <MezonIconCDN icon={IconCDN.channelNotificaitionIcon} color={themeValue.textStrong} />
		}
	];

	const organizationMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.organizationMenu.edit'),
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
					screen: APP_SCREEN.MENU_CLAN.CATEGORY_SETTING,
					params: {
						categoryId: category?.category_id
					}
				});
			},
			icon: <MezonIconCDN icon={IconCDN.settingIcon} color={themeValue.textStrong} />,
			isShow: isCanManageClan
		},
		{
			title: t('menu.organizationMenu.createChannel'),
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
					screen: APP_SCREEN.MENU_CLAN.CREATE_CHANNEL,
					params: {
						categoryId: category?.category_id
					}
				});
			},
			icon: <MezonIconCDN icon={IconCDN.plusLargeIcon} color={themeValue.textStrong} />,
			isShow: isCanManageChannel
		},
		{
			title: t('menu.organizationMenu.delete'),
			onPress: handleDelete,
			icon: <MezonIconCDN icon={IconCDN.closeLargeIcon} color={baseColor.redStrong} />,
			isShow: isCanManageClan,
			textStyle: {
				color: baseColor.redStrong
			}
		}
	];

	const devMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.devMode.copyServerID'),
			icon: <MezonIconCDN icon={IconCDN.idIcon} color={themeValue.textStrong} />,
			onPress: () => {
				Clipboard.setString(category?.category_id);
				Toast.show({
					type: 'info',
					text1: t('notify.serverIDCopied')
				});
			}
		}
	];

	const menu: IMezonMenuSectionProps[] = [
		{
			items: watchMenu
		},
		// {
		// 	items: inviteMenu
		// },
		{
			items: notificationMenu
		},
		{
			items: organizationMenu
		},
		{
			items: devMenu
		}
	];

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.avatarWrapper}>
					<MezonClanAvatar defaultColor={baseColor.blurple} alt={currentClan?.clan_name} image={currentClan?.logo} />
				</View>
				<Text style={styles.serverName}>{category?.category_name}</Text>
			</View>

			<View>
				<MezonMenu menu={menu} />
			</View>
		</View>
	);
}
