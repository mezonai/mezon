import { usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannelId, selectCurrentClan } from '@mezon/store-mobile';
import { EPermission, ICategoryChannel } from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../app/navigation/ScreenTypes';
import MezonClanAvatar from '../../../../../componentUI/MezonClanAvatar';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps, reserve } from '../../../../../componentUI/MezonMenu';
import InviteToChannel from '../InviteToChannel';
import { style } from './styles';

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
	const [isCanManageChannel] = usePermissionChecker([EPermission.manageChannel], currentChanelId ?? '');
	const navigation = useNavigation<AppStackScreenProps<StackMenuClanScreen>['navigation']>();

	const watchMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.watchMenu.markAsRead'),
			onPress: () => reserve(),
			icon: <Icons.EyeIcon color={themeValue.textStrong} />
		}
	];

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
			icon: <Icons.GroupPlusIcon color={themeValue.textStrong} />
		}
	];

	const notificationMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.notification.muteCategory'),
			onPress: () => reserve(),
			icon: <Icons.BellSlashIcon color={themeValue.textStrong} />
		},
		{
			title: t('menu.notification.notification'),
			onPress: () => reserve(),
			icon: <Icons.ChannelNotificationIcon color={themeValue.textStrong} />
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
			icon: <Icons.SettingsIcon color={themeValue.textStrong} />,
			isShow: isCanManageChannel
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
			icon: <Icons.PlusLargeIcon color={themeValue.textStrong} />,
			isShow: isCanManageChannel
		}
	];

	const devMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.devMode.copyServerID'),
			icon: <Icons.IDIcon color={themeValue.textStrong} />,
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
		{
			items: inviteMenu
		},
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
