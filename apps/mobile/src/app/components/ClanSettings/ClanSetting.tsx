import { usePermissionChecker } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { EPermission } from '@mezon/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { IMezonMenuItemProps, IMezonMenuSectionProps, MezonMenu, reserve } from '../../componentUI';
import useBackHardWare from '../../hooks/useBackHardWare';
import { APP_SCREEN, MenuClanScreenProps } from '../../navigation/ScreenTypes';
import { LogoClanSelector } from './LogoClanSelector';
import { style } from './styles';

type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.SETTINGS;

export function ClanSetting({ navigation, route }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { inviteRef } = route?.params || {};
	const { t } = useTranslation(['clanSetting']);
	const [hasAdminPermission, hasManageClanPermission, isClanOwner] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	useBackHardWare();

	const isCanEditRole = useMemo(() => {
		return hasAdminPermission || isClanOwner || hasManageClanPermission;
	}, [hasAdminPermission, hasManageClanPermission, isClanOwner]);

	navigation.setOptions({
		headerLeft: () => (
			<Pressable style={{ padding: 20 }} onPress={handleClose}>
				<Icons.CloseSmallBoldIcon height={20} width={20} color={themeValue.textStrong} />
			</Pressable>
		)
	});

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
			icon: <Icons.CircleInformationIcon color={themeValue.text} />
		},
		// {
		// 	title: t('menu.settings.moderation'),
		// 	onPress: () => reserve(),
		// 	expandable: true,
		// 	icon: <Icons.ModerationIcon color={themeValue.text} />,
		// },
		{
			title: t('menu.settings.auditLog'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.AUDIT_LOG);
			},
			expandable: true,
			icon: <Icons.ClipboardListIcon color={themeValue.text} />,
			isShow: isCanEditRole
		},
		// {
		// 	title: t('menu.settings.channels'),
		// 	onPress: () => reserve(),
		// 	expandable: true,
		// 	icon: <Icons.ChannelListIcon color={themeValue.text} />,
		// },
		{
			title: t('menu.settings.integrations'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.INTEGRATIONS);
			},
			expandable: true,
			icon: <Icons.GameControllerIcon color={themeValue.text} />,
			isShow: hasAdminPermission
		},
		{
			title: t('menu.settings.emoji'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.EMOJI_SETTING);
			},
			expandable: true,
			icon: <Icons.ReactionIcon color={themeValue.text} />
		},
		{
			title: t('menu.settings.sticker'),
			onPress: async () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.STICKER_SETTING);
			},
			expandable: true,
			icon: <Icons.Sticker color={themeValue.text} />
		}
		// {
		// 	title: t('menu.settings.webhooks'),
		// 	onPress: () => reserve(),
		// 	expandable: true,
		// 	icon: <Icons.WebhookIcon color={themeValue.text} />
		// }
		// {
		// 	title: t('menu.settings.security'),
		// 	onPress: () => reserve(),
		// 	expandable: true,
		// 	icon: <Icons.ShieldUserIcon color={themeValue.text} />,
		// },
	];

	const communityMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.community.enableCommunity'),
			onPress: () => reserve(),
			expandable: true,
			icon: <Icons.TreeHouseIcon color={themeValue.text} />
		}
	];

	const subscriptionMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.subscriptions.getStarted'),
			onPress: () => reserve(),
			expandable: true,
			icon: <Icons.ShopSparkleIcon color={themeValue.text} />
		}
	];

	const userManagementMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.userManagement.members'),
			onPress: async () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.MEMBER_SETTING);
			},
			expandable: true,
			icon: <Icons.GroupIcon color={themeValue.text} />
		},
		{
			title: t('menu.userManagement.role'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
			},
			expandable: true,
			icon: <Icons.ShieldUserIcon color={themeValue.text} />,
			isShow: isCanEditRole
		},
		{
			title: t('menu.userManagement.invite'),
			onPress: () => inviteRef?.current?.present(),
			expandable: true,
			icon: <Icons.LinkIcon color={themeValue.text} />
		},
		{
			title: t('menu.userManagement.bans'),
			onPress: () => reserve(),
			expandable: true,
			icon: <Icons.HammerIcon color={themeValue.text} />
		}
	];

	const menu: IMezonMenuSectionProps[] = [
		{
			title: t('menu.settings.title'),
			items: settingsMenu
		},
		// {
		// 	title: t('menu.community.title'),
		// 	items: communityMenu,
		// },
		// {
		// 	title: t('menu.subscriptions.title'),
		// 	items: subscriptionMenu,
		// },
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
