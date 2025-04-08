import { selectAllAccount, selectAllTextChannel, selectCurrentClanId, selectEventsByClanId, useAppSelector } from '@mezon/store';
import { EEventStatus } from '@mezon/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useEventManagementQuantity = () => {
	const userId = useSelector(selectAllAccount)?.user?.id;

	const currentClanId = useSelector(selectCurrentClanId);

	const allEventManagement = useAppSelector((state) => selectEventsByClanId(state, currentClanId as string));
	const allThreadChannelPrivate = useSelector(selectAllTextChannel);
	const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channel_id);

	const eventsByUser = useMemo(
		() =>
			allEventManagement.filter(
				(event) =>
					(!event?.is_private || event.creator_id === userId) &&
					(!event.channel_id || event.channel_id === '0' || allThreadChannelPrivateIds.includes(event.channel_id))
			),
		[allEventManagement, allThreadChannelPrivateIds, userId]
	);

	const numberEventManagement = eventsByUser.length;

	const eventUpcoming = useMemo(
		() => eventsByUser.filter((event) => event.event_status === EEventStatus.UPCOMING || event.event_status === EEventStatus.ONGOING),
		[eventsByUser]
	);
	const numberEventUpcoming = eventUpcoming.length;

	return {
		allEventManagement,
		allThreadChannelPrivate,
		eventsByUser,
		numberEventManagement,
		eventUpcoming,
		numberEventUpcoming
	};
};
