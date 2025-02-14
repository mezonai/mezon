import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllWebhooks } from '@mezon/store-mobile';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { WebhooksEmpty } from './WebhooksEmpty';
import { WebhooksItem } from './WebhooksItem';
import { style } from './styles';

export function Webhooks() {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['clanIntegrationsSetting']);
	const allWebhooks = useSelector(selectAllWebhooks);

	return (
		<View
			style={{ paddingHorizontal: size.s_10, paddingVertical: size.s_16, backgroundColor: themeValue.primary, width: '100%', height: '100%' }}
		>
			<Text style={styles.description}>
				{t('webhooks.description')}
				<Text style={styles.textLink}>{t('webhooks.learnMore')}</Text>
			</Text>
			{allWebhooks?.length ? (
				allWebhooks?.map((webhook) => {
					return <WebhooksItem webhook={webhook} key={webhook?.id} />;
				})
			) : (
				<WebhooksEmpty />
			)}
		</View>
	);
}
