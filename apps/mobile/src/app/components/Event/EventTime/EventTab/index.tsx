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
	const currentEvent = useAppSelector((state) => selectEventById(state, event?.clan_id ?? '0', event?.id ?? '0'));

	const interestedMembersCount = useMemo(() => {
		return currentEvent?.user_ids?.filter((id) => !!id && id !== '0')?.length;
	}, [currentEvent?.user_ids]);

	const titleEvent = useMemo(() => {
		if (interestedMembersCount > 0) {
			return [t('detail.eventInfo'), `${interestedMembersCount} ${t('item.interested')}`];
		}
		return [t('detail.eventInfo'), t('item.interested')];
	}, [interestedMembersCount, t]);

	return <MezonTab views={[<EventDetail event={event} />, <EventMember event={event} />]} titles={titleEvent} isBottomSheet={isBottomSheet} />;
});
