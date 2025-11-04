import { useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, selectChannelById, useAppSelector } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { style } from './styles';

interface IEventLocation {
	event: EventManagementEntity;
}
export const EventChannelDetail = memo(({ event }: IEventLocation) => {
	const { t } = useTranslation(['eventCreator', 'common']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const eventChannel = useAppSelector((state) => selectChannelById(state, event?.channel_id || ''));
	const channelType = useMemo(() => {
		return eventChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ? t('common:channelLabel') : t('common:threadLabel');
	}, [eventChannel?.type, t]);

	return (
		<Text style={styles.container}>
			<Text style={styles.description}>{t('screens.channelSelection.channel', { channel: channelType })}</Text>
			<Text style={styles.channelTitle}>{eventChannel?.channel_label}</Text>
		</Text>
	);
});
