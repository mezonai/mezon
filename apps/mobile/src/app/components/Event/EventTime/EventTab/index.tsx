import type { EventManagementEntity } from '@mezon/store-mobile';
import { selectEventById, useAppSelector } from '@mezon/store-mobile';
import type { TFunction } from 'i18next';
import { memo, useMemo } from 'react';
import MezonTab from '../../../../componentUI/MezonTab';
import { EventDetail } from '../../EventDetail';
import { EventMember } from '../../EventMember';

interface IEventTabProps {
	event: EventManagementEntity;
	t: TFunction;
	isBottomSheet?: boolean;
}

export const EventTab = memo(({ event, t, isBottomSheet = false }: IEventTabProps) => {
	const currentEvent = useAppSelector((state) => selectEventById(state, event?.clanId ?? '', event?.id ?? ''));

	const titleEvent = useMemo(() => {
		if (currentEvent?.userIds?.length > 0) {
			return [t('detail.eventInfo'), `${currentEvent.userIds.length.toString()} ${t('item.interested')}`];
		}
		return [t('detail.eventInfo'), t('item.interested')];
	}, [currentEvent?.userIds?.length, t]);

	return <MezonTab views={[<EventDetail event={event} />, <EventMember event={event} />]} titles={titleEvent} isBottomSheet={isBottomSheet} />;
});
