import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { EFriendRequest } from '..';
import { style } from './styles';

export const EmptyFriendRequest = ({ type }: { type: EFriendRequest }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('friends');

	const emptyData = useMemo(() => {
		return type === EFriendRequest.Received
			? {
					title: t('friendRequest.emptyReceived.title'),
					description: t('friendRequest.emptyReceived.description')
				}
			: {
					title: t('friendRequest.emptySent.title'),
					description: t('friendRequest.emptySent.description')
				};
	}, [type, t]);

	return (
		<View style={styles.emptyContainer}>
			<Icons.IconPeople width={size.s_80} height={size.s_80} color={themeValue.textDisabled} />
			<Text style={styles.emptyTitle}>{emptyData.title}</Text>
			<Text style={styles.emptyDescription}>{emptyData.description}</Text>
		</View>
	);
};
