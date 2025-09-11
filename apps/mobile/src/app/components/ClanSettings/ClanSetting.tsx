import { usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { EPermission } from '@mezon/utils';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, ScrollView, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../componentUI/MezonMenu';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import InviteToChannel from '../../screens/home/homedrawer/components/InviteToChannel';
import { LogoClanSelector } from './LogoClanSelector';
import { style } from './styles';

type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.SETTINGS;

export function ClanSetting({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanSetting']);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);

	const isCanEditRole = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner]);

	useEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerLeft: () => (
				<Pressable style={{ padding: 20 }} onPress={handleClose}>
					<MezonIconCDN icon={IconCDN.closeSmallBold} color={themeValue.textStrong} />
				</Pressable>
			)
		});
	}, [navigation, themeValue.textStrong]);

	function handleClose() {
		navigation.goBack();
	}

	const settingsMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.settings.overview'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.OVERVIEW_SETTING);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.circleInformation} color={themeValue.text} />
		},
		{
			title: t('menu.settings.auditLog'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.AUDIT_LOG);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.clipboardIcon} color={themeValue.text} />,
			isShow: isCanEditRole
		},
		{
			title: t('menu.settings.integrations'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.INTEGRATIONS, {
					isClanSetting: true
				});
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.gameControllerIcon} color={themeValue.text} />,
			isShow: hasAdminPermission
		},
		{
			title: t('menu.settings.emoji'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.EMOJI_SETTING);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.reactionIcon} color={themeValue.text} />
		},
		{
			title: t('menu.settings.sticker'),
			onPress: async () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.STICKER_SETTING);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.sticker} color={themeValue.text} />
		},
		{
			title: t('menu.settings.sound'),
			onPress: async () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.SOUND_STICKER);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.channelVoice} color={themeValue.text} />
		}
	];

	const userManagementMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.userManagement.members'),
			onPress: async () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.MEMBER_SETTING);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.groupIcon} color={themeValue.text} />
		},
		{
			title: t('menu.userManagement.role'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.shieldUserIcon} color={themeValue.text} />,
			isShow: isCanEditRole
		},
		{
			title: t('menu.userManagement.invite'),
			onPress: () => {
				const data = {
					snapPoints: ['70%', '90%'],
					children: <InviteToChannel isUnknownChannel={false} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			},
			expandable: true,
			icon: <MezonIconCDN icon={IconCDN.linkIcon} color={themeValue.text} />
		}
	];

	const menu: IMezonMenuSectionProps[] = [
		{
			title: t('menu.settings.title'),
			items: settingsMenu
		},
		{
			title: t('menu.userManagement.title'),
			items: userManagementMenu
		}
	];

	return (
		<View style={{ flex: 1, backgroundColor: themeValue.secondary }}>
			<ScrollView contentContainerStyle={styles.container} style={{ flex: 1, backgroundColor: themeValue.primary }}>
				<LogoClanSelector />
				<MezonMenu menu={menu} />
			</ScrollView>
		</View>
	);
}
