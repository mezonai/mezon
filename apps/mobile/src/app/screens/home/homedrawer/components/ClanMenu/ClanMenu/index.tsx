import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useMarkAsRead, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { appActions, categoriesActions, selectCurrentClan, selectIsShowEmptyCategory, useAppDispatch } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { IMezonMenuItemProps, IMezonMenuSectionProps, MezonClanAvatar, MezonMenu, MezonSwitch, reserve } from '../../../../../../componentUI';
import MezonButtonIcon from '../../../../../../componentUI/MezonButtonIcon';
import DeleteClanModal from '../../../../../../components/DeleteClanModal';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import { EProfileTab } from '../../../../../settings/ProfileSetting';
import ClanMenuInfo from '../ClanMenuInfo';
import { style } from './styles';

enum StatusMarkAsReadClan {
	Error = 'error',
	Success = 'success',
	Idle = 'idle',
	Pending = 'pending'
}

export default function ClanMenu() {
	const currentClan = useSelector(selectCurrentClan);
	const { t } = useTranslation(['clanMenu']);
	const { themeValue } = useTheme();
	const [isVisibleDeleteModal, setIsVisibleDeleteModal] = useState<boolean>(false);
	const [isLeaveClan, setIsLeaveClan] = useState<boolean>(false);
	const styles = style(themeValue);

	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const { dismiss } = useBottomSheetModal();
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
	const handleOpenInvite = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_INVITE_CHANNEL);
		dismiss();
	};

	const handleOpenSettings = () => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.SETTINGS });
		dismiss();
	};

	const handelOpenNotifications = useCallback(() => {
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.NOTIFICATION_SETTING });
		dismiss();
	}, []);

	const organizationMenu: IMezonMenuItemProps[] = [
		// {
		// 	onPress: () => reserve(),
		// 	title: t('menu.organizationMenu.createChannel'),
		// },
		{
			onPress: () => {
				dismiss();
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.CREATE_CATEGORY });
			},
			title: t('menu.organizationMenu.createCategory')
		},
		{
			onPress: () => {
				dismiss();
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, { screen: APP_SCREEN.MENU_CLAN.CREATE_EVENT });
			},
			title: t('menu.organizationMenu.createEvent')
		}
	];

	const optionsMenu: IMezonMenuItemProps[] = [
		{
			onPress: () => {
				dismiss();
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
					screen: APP_SCREEN.SETTINGS.PROFILE,
					params: { profileTab: EProfileTab.ClanProfile }
				});
			},
			title: t('menu.optionsMenu.editServerProfile')
		},
		{
			onPress: () => {
				dismiss();
				navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
					screen: APP_SCREEN.MENU_CLAN.AUDIT_LOG
				});
			},
			title: t('menu.optionsMenu.auditLog'),
			isShow: isCanEditRole
		},

		// {
		// 	title: t('menu.optionsMenu.showAllChannels'),
		// 	component: <MezonSwitch />,
		// },
		// {
		// 	title: t('menu.optionsMenu.hideMutedChannels'),
		// 	component: <MezonSwitch />,
		// },
		// {
		// 	title: t('menu.optionsMenu.allowDirectMessage'),
		// 	component: <MezonSwitch />,
		// },
		// {
		// 	title: t('menu.optionsMenu.allowMessageRequest'),

		// 	component: <MezonSwitch />,
		// },
		// {
		// 	onPress: () => reserve(),
		// 	title: t('menu.optionsMenu.reportServer'),
		// },
		{
			onPress: () => {
				setIsVisibleDeleteModal(true);
				setIsLeaveClan(true);
			},
			isShow: !isClanOwner,
			title: t('menu.optionsMenu.leaveServer'),
			textStyle: { color: 'red' }
		},
		{
			onPress: () => {
				setIsVisibleDeleteModal(true);
			},
			isShow: isClanOwner,
			title: t('menu.optionsMenu.deleteClan'),
			textStyle: { color: 'red' }
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
				await handleMarkAsReadClan(currentClan?.clan_id);
				dismiss();
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
			dispatch(categoriesActions.setShowEmptyCategory());
		} else {
			dispatch(categoriesActions.setHideEmptyCategory());
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
					<MezonClanAvatar image={currentClan?.logo} alt={currentClan?.clan_name} />
				</View>
				<Text style={styles.serverName}>{currentClan?.clan_name}</Text>
				<ClanMenuInfo clan={currentClan} />

				<ScrollView contentContainerStyle={styles.actionWrapper} horizontal>
					<MezonButtonIcon
						title={`18 ${t('actions.boot')}`}
						icon={<Icons.BoostTier2Icon color={baseColor.purple} />}
						onPress={() => reserve()}
					/>
					<MezonButtonIcon
						title={t('actions.invite')}
						icon={<Icons.GroupPlusIcon color={themeValue.textStrong} />}
						onPress={handleOpenInvite}
					/>
					<MezonButtonIcon
						title={t('actions.notifications')}
						icon={<Icons.BellIcon color={themeValue.textStrong} />}
						onPress={handelOpenNotifications}
					/>

					<MezonButtonIcon
						title={t('actions.settings')}
						icon={<Icons.SettingsIcon color={themeValue.textStrong} />}
						onPress={handleOpenSettings}
					/>
				</ScrollView>
				<View>
					<MezonMenu menu={menu} marginVertical={0} />
				</View>
			</View>
			<DeleteClanModal
				isVisibleModal={isVisibleDeleteModal}
				visibleChange={(isVisible) => {
					setIsVisibleDeleteModal(isVisible);
				}}
				isLeaveClan={isLeaveClan}
			></DeleteClanModal>
		</View>
	);
}
