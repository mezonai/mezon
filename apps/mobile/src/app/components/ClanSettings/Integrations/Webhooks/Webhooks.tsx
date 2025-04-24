import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllClanWebhooks, selectWebhooksByChannelId, useAppSelector } from '@mezon/store-mobile';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { WebhooksEmpty } from './WebhooksEmpty';
import { WebhooksItem } from './WebhooksItem';
import { style } from './styles';

export function Webhooks({ route }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { channelId } = route?.params || {};
	const { t } = useTranslation(['clanIntegrationsSetting']);
	const allWebhooks = useAppSelector((state) => selectWebhooksByChannelId(state, channelId));
	const allClanWebhooks = useAppSelector(selectAllClanWebhooks);
	const webhookList = useMemo(() => {
		return channelId ? allWebhooks : allClanWebhooks;
	}, [allClanWebhooks, allWebhooks, channelId]);

	return (
		<View
			style={{ paddingHorizontal: size.s_10, paddingVertical: size.s_16, backgroundColor: themeValue.primary, width: '100%', height: '100%' }}
		>
			<Text style={styles.description}>
				{t('webhooks.description')}
				<Text style={styles.textLink}>{t('webhooks.learnMore')}</Text>
			</Text>
			{webhookList?.length ? (
				webhookList?.map((webhook) => {
					return <WebhooksItem webhook={webhook} key={webhook?.id} />;
				})
			) : (
				<WebhooksEmpty />
			)}
		</View>
	);
}
