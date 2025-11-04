import type { LangCode } from '@mezon/mobile-components';
import { isSameDay, timeFormat } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { EventManagementEntity } from '@mezon/store-mobile';
import i18n from '@mezon/translations';
import { EEventStatus } from '@mezon/utils';
import moment from 'moment';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonBadge from '../../../componentUI/MezonBadge';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface IEventTimeProps {
	event: EventManagementEntity;
	eventStatus: number;
	minutes: number;
}

export function EventTime({ event, eventStatus, minutes }: IEventTimeProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['eventCreator']);

	const { colorStatusEvent, textStatusEvent } = useMemo(() => {
		let color;
		let text;

		switch (eventStatus) {
			case EEventStatus?.UPCOMING:
				color = baseColor.blurple;
				text = t('eventDetail.tenMinutesLeft', { minutes });
				break;
			case EEventStatus.ONGOING:
				color = baseColor.green;
				text = t('eventDetail.eventIsTaking');
				break;
			default: {
				color = themeValue.textStrong;
				const localOffset = moment().utcOffset();
				text = timeFormat(moment.utc(event?.start_time).add(localOffset, 'minutes').toISOString(), t, i18n.language as LangCode);
				break;
			}
		}

		return { colorStatusEvent: color, textStatusEvent: text };
	}, [eventStatus, event.start_time, t]);

	return (
		<View style={styles.inline}>
			{isSameDay(event.create_time as string) && <MezonBadge title={t('eventDetail.newEvent')} type="success" />}
			<MezonIconCDN icon={IconCDN.calendarIcon} height={size.s_20} width={size.s_20} color={colorStatusEvent} />
			<Text style={[styles.smallText, { color: colorStatusEvent }]}>{textStatusEvent}</Text>
		</View>
	);
}
