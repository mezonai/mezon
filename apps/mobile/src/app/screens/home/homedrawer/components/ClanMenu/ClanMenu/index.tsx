import { useMarkAsRead, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	categoriesActions,
	selectCurrentClanId,
	selectCurrentClanLogo,
	selectCurrentClanName,
	selectDefaultNotificationClan,
	selectIsShowEmptyCategory,
	useAppDispatch
} from '@mezon/store-mobile';
import { EPermission, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../../src/app/constants/icon_cdn';
import MezonButtonIcon from '../../../../../../componentUI/MezonButtonIcon';
import MezonClanAvatar from '../../../../../../componentUI/MezonClanAvatar';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../../componentUI/MezonMenu';
import MezonSwitch from '../../../../../../componentUI/MezonSwitch';
import DeleteClanModal from '../../../../../../components/DeleteClanModal';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import { EProfileTab } from '../../../../../settings/ProfileSetting';
import InviteToChannel from '../../InviteToChannel';
import ClanMenuInfo from '../ClanMenuInfo';
import { style } from './styles';

enum StatusMarkAsReadClan {
	Error = 'error',
	Success = 'success',
	Idle = 'idle',
	Pending = 'pending'
}

export default function ClanMenu() {
	const { t } = useTranslation(['clanMenu']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);
	const currentClanLogo = useSelector(selectCurrentClanLogo);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const dispatch = useAppDispatch();
	const { handleMarkAsReadClan, statusMarkAsReadClan } = useMarkAsRead();

	const isShowEmptyCategory = useSelector(selectIsShowEmptyCategory);
	const [showEmptyCategories, setShowEmptyCategories] = useState<boolean>(isShowEmptyCategory ?? true);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const isCanEditRole = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner]);
	const handleOpenInvite = useCallback(() => {
		const data = {
			snapPoints: ['70%', '90%'],
			children: <InviteToChannel isUnknownChannel={false} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	const handleOpenSettings = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.SETTINGS });
	}, [navigation]);

	const handelOpenNotifications = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING });
	}, [navigation]);

	const organizationMenu: IMezonMenuItemProps[] = [
		{
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.CREATE_CATEGORY });
			},
			title: t('menu.organizationMenu.createCategory'),
			isShow: isCanEditRole
		},
		{
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.CREATE_EVENT });
			},
			title: t('menu.organizationMenu.createEvent')
		}
	];

	const optionsMenu: IMezonMenuItemProps[] = [
		{
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
					screen: APP_SCREEN.SETTINGS.PROFILE,
					params: { profileTab: EProfileTab.ClanProfile }
				});
			},
			title: t('menu.optionsMenu.editServerProfile')
		},
		{
			onPress: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
					screen: APP_SCREEN.MENU_CLAN.AUDIT_LOG
				});
			},
			title: t('menu.optionsMenu.auditLog'),
			isShow: isCanEditRole
		},
		{
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					children: <DeleteClanModal isLeaveClan={true} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			},
			isShow: !isClanOwner,
			title: t('menu.optionsMenu.leaveServer'),
			textStyle: { color: baseColor.redStrong }
		},
		{
			onPress: async () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
				await sleep(500);
				const data = {
					children: <DeleteClanModal isLeaveClan={false} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			},
			isShow: isClanOwner,
			title: t('menu.optionsMenu.deleteClan'),
			textStyle: { color: baseColor.redStrong }
		}
	];

	const optionsShowEmptyCategories: IMezonMenuItemProps[] = [
		{
			title: t('menu.optionShowEmptyCategories.title'),
			component: <MezonSwitch onValueChange={handleToggleEmptyCategories} value={showEmptyCategories} />
		}
	];

	const watchMenu: IMezonMenuItemProps[] = [
		{
			onPress: async () => {
				await handleMarkAsReadClan(currentClanId);
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			},
			title: t('menu.watchMenu.markAsRead')
		}
	];
	const menu: IMezonMenuSectionProps[] = [
		{
			items: watchMenu
		},
		{
			items: organizationMenu
		},
		{
			items: optionsMenu
		},
		{
			items: optionsShowEmptyCategories
		}
	];

	function handleToggleEmptyCategories(value: boolean) {
		if (value) {
			dispatch(categoriesActions.setShowEmptyCategory(currentClanId));
		} else {
			dispatch(categoriesActions.setHideEmptyCategory(currentClanId));
		}
		setShowEmptyCategories(value);
	}

	useEffect(() => {
		dispatch(appActions.setLoadingMainMobile(statusMarkAsReadClan === StatusMarkAsReadClan.Pending));
	}, [statusMarkAsReadClan, dispatch]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.avatarWrapper}>
					<MezonClanAvatar image={currentClanLogo} alt={currentClanName} />
				</View>
				<Text style={styles.serverName}>{currentClanName}</Text>
				<ClanMenuInfo />

				<ScrollView contentContainerStyle={styles.actionWrapper} horizontal>
					<MezonButtonIcon
						title={t('actions.invite')}
						icon={<MezonIconCDN icon={IconCDN.groupPlusIcon} color={themeValue.textStrong} />}
						onPress={handleOpenInvite}
					/>
					<MezonButtonIcon
						title={t('actions.notifications')}
						icon={
							<MezonIconCDN
								icon={defaultNotificationClan?.notification_setting_type === 3 ? IconCDN.bellSlashIcon : IconCDN.bellIcon}
								color={themeValue.textStrong}
							/>
						}
						onPress={handelOpenNotifications}
					/>

					<MezonButtonIcon
						title={t('actions.settings')}
						icon={<MezonIconCDN icon={IconCDN.settingIcon} color={themeValue.textStrong} />}
						onPress={handleOpenSettings}
					/>
				</ScrollView>
				<View>
					<MezonMenu menu={menu} marginVertical={0} />
				</View>
			</View>
		</View>
	);
}
