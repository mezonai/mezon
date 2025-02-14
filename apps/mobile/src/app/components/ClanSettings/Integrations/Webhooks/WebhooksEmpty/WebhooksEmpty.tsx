import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { style } from './styles';
export function WebhooksEmpty() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanIntegrationsSetting']);

	return (
		<View style={{ backgroundColor: themeValue.primary, width: '100%', height: '100%', alignItems: 'center', gap: size.s_10 }}>
			<Icons.EmptyWebHook />
			<Text style={styles.title}>{t('webhooksEmpty.noWebhooks')}</Text>
			<Text style={styles.subTitle}>{t('webhooksEmpty.webhooksEmptyDes')}</Text>
		</View>
	);
}
