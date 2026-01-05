import { selectAllAccount, selectAllTextChannel, selectCurrentClanId, selectEventsByClanId, useAppSelector } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useEventManagementQuantity = () => {
	const userId = useSelector(selectAllAccount)?.user?.id;

	const currentClanId = useSelector(selectCurrentClanId);

	const allEventManagement = useAppSelector((state) => selectEventsByClanId(state, currentClanId as string));
	const allThreadChannelPrivate = useSelector(selectAllTextChannel);
	const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channelId);

	const eventsByUser = useMemo(
		() =>
			allEventManagement.filter(
				(event) =>
					(!event?.is_private || event.creatorId === userId) &&
					(!event.channelId || event.channelId === '0' || allThreadChannelPrivateIds.includes(event.channelId))
			),
		[allEventManagement, allThreadChannelPrivateIds, userId]
	);

	const numberEventManagement = eventsByUser.length;

	const eventUpcoming = useMemo(
		() => eventsByUser.filter((event) => {
			if (!event.start_time) {
				return false;
			}
			const startTime = new Date(event.start_time).getTime();
			const currentTime = Date.now();
			const timeDiff = startTime - currentTime;
			const minutesLeft = Math.ceil(timeDiff / (1000 * 60));
			return minutesLeft <= 10;
		}),
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
