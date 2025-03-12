import { usePermissionChecker } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { fetchWebhooks, selectCurrentClanId, useAppDispatch } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from '../styles';

export function Integrations() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const { t } = useTranslation(['clanIntegrationsSetting']);

	const currentClanId = useSelector(selectCurrentClanId) as string;
	const [canManageClan] = usePermissionChecker([EPermission.manageClan]);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (canManageClan) {
			dispatch(fetchWebhooks({ channelId: '0', clanId: currentClanId }));
		}
	}, [canManageClan, currentClanId, dispatch]);
	const integrationsMenu: IMezonMenuItemProps[] = [
		{
			title: t('integration.title'),
			onPress: () => {
				navigation.navigate(APP_SCREEN.MENU_CLAN.WEBHOOKS);
			},
			expandable: true,
			icon: <Icons.WebhookIcon color={themeValue.text} />,
			description: t('integration.automatedMessage')
		}
	];
	const menu: IMezonMenuSectionProps[] = [
		{
			items: integrationsMenu
		}
	];

	return (
		<View style={{ paddingHorizontal: size.s_10, backgroundColor: themeValue.primary, width: '100%', height: '100%' }}>
			<MezonMenu menu={menu} />
		</View>
	);
}
