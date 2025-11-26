import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import ImageNative from '../../../../ImageNative';
import { style } from './styles';
export function WebhooksEmpty() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanIntegrationsSetting']);

	return (
		<View style={{ backgroundColor: themeValue.primary, width: '100%', height: '100%', alignItems: 'center', gap: size.s_10 }}>
			<ImageNative
				url="https://cdn.mezon.ai/1827886151055183872/1840671774119825408/1820658435042054100/1741944808674_0webhookEmptyIcon.png"
				style={styles.hookEmpty}
			/>
			<Text style={styles.title}>{t('webhooksEmpty.noWebhooks')}</Text>
		</View>
	);
}
