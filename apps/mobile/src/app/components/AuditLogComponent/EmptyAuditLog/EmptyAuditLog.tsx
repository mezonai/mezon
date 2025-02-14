import { size, Text, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function EmptyAuditLog() {
	const { themeValue } = useTheme();
	const { t } = useTranslation('auditLog');

	return (
		<View style={{ width: '100%', height: '100%', gap: size.s_10, alignItems: 'center', paddingTop: size.s_50 }}>
			<Text h4 bold color={themeValue.white}>
				{t('emptyAuditLog.noLogsYet')}
			</Text>
			<Text h4 color={themeValue.text}>
				{t('emptyAuditLog.description')}
			</Text>
		</View>
	);
}
