import { size, useTheme, verticalScale } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function EmptyAuditLog() {
	const { themeValue } = useTheme();
	const { t } = useTranslation('auditLog');

	return (
		<View style={{ width: '100%', height: '100%', gap: size.s_10, alignItems: 'center', paddingTop: size.s_50 }}>
			<Text
				style={{
					fontSize: verticalScale(16),
					marginLeft: 0,
					marginRight: 0,
					fontWeight: 'bold',
					color: themeValue.white
				}}
			>
				{t('emptyAuditLog.noLogsYet')}
			</Text>
			<Text
				style={{
					fontSize: verticalScale(16),
					color: themeValue.white,
					textAlign: 'center'
				}}
			>
				{t('emptyAuditLog.description')}
			</Text>
		</View>
	);
}
