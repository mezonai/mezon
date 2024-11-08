import {
	channelMetaActions,
	channelsActions,
	ChannelsEntity,
	clansActions,
	markAsReadProcessing,
	selectChannelsByClanId,
	selectCurrentClanId,
	useAppDispatch
} from '@mezon/store';
import { ChannelThreads, ICategoryChannel, TIME_OFFSET } from '@mezon/utils';
import { ApiMarkAsReadRequest } from 'mezon-js/api.gen';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

export function useMarkAsRead() {
	const dispatch = useAppDispatch();

	const [statusMarkAsReadChannel, setStatusMarkAsReadChannel] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadCategory, setStatusMarkAsReadCategory] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadClan, setStatusMarkAsReadClan] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const currentClanId = useSelector(selectCurrentClanId);
	const channelsInClan = useSelector(selectChannelsByClanId(currentClanId ?? ''));

	const actionMarkAsRead = useCallback(
		async (body: ApiMarkAsReadRequest) => {
			const result = await dispatch(markAsReadProcessing(body));
			return result;
		},
		[dispatch]
	);

	const resetCountChannelBadge = useCallback(
		(channel: ChannelsEntity) => {
			const timestamp = Date.now() / 1000;
			dispatch(
				channelMetaActions.setChannelLastSeenTimestamp({
					channelId: channel?.channel_id ?? '',
					timestamp: timestamp + TIME_OFFSET
				})
			);

			dispatch(
				clansActions.updateClanBadgeCount({
					clanId: channel?.clan_id ?? '',
					count: (channel?.count_mess_unread ?? 0) * -1
				})
			);

			dispatch(
				channelsActions.updateChannelBadgeCount({
					channelId: channel?.channel_id ?? '',
					count: 0,
					isReset: true
				})
			);
		},
		[dispatch]
	);

	const handleMarkAsReadChannel = useCallback(
		async (channel: ChannelsEntity) => {
			const body: ApiMarkAsReadRequest = {
				clan_id: channel.clan_id,
				category_id: channel.category_id,
				channel_id: channel.channel_id
			};

			setStatusMarkAsReadChannel('pending');

			try {
				const result = await actionMarkAsRead(body);

				setStatusMarkAsReadChannel('success');
				resetCountChannelBadge(channel);

				const allThreadsInChannel = getThreadWithBadgeCount(channel);
				if (allThreadsInChannel && allThreadsInChannel.length > 0)
					allThreadsInChannel.forEach((channel: ChannelsEntity) => {
						resetCountChannelBadge(channel);
					});
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadChannel('error');
			}
		},
		[actionMarkAsRead, resetCountChannelBadge]
	);

	const handleMarkAsReadCategory = useCallback(
		async (category: ICategoryChannel) => {
			const body: ApiMarkAsReadRequest = {
				clan_id: category.clan_id,
				category_id: category.category_id
			};

			setStatusMarkAsReadCategory('pending');
			try {
				const result = await actionMarkAsRead(body);
				const allChannelsAndThreads = getChannelsWithBadgeCountCategory(category);
				setStatusMarkAsReadCategory('success');
				allChannelsAndThreads.forEach((channel: ChannelsEntity) => {
					resetCountChannelBadge(channel);
				});
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadCategory('error');
			}
		},
		[actionMarkAsRead, resetCountChannelBadge]
	);

	const handleMarkAsReadClan = useCallback(
		async (clanId: string) => {
			const body: ApiMarkAsReadRequest = {
				clan_id: clanId ?? ''
			};

			setStatusMarkAsReadClan('pending');
			try {
				const result = await actionMarkAsRead(body);
				const allChannelsAndThreads = getChannelsWithBadgeCountClan(channelsInClan);
				setStatusMarkAsReadClan('success');
				allChannelsAndThreads.forEach((channel: ChannelsEntity) => {
					resetCountChannelBadge(channel);
				});
				dispatch(clansActions.updateClanBadgeCount({ clanId: clanId ?? '', count: 0, isReset: true }));
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadClan('error');
			}
		},
		[actionMarkAsRead, resetCountChannelBadge]
	);

	return useMemo(
		() => ({
			resetCountChannelBadge,
			handleMarkAsReadChannel,
			statusMarkAsReadChannel,
			handleMarkAsReadCategory,
			statusMarkAsReadCategory,
			handleMarkAsReadClan,
			statusMarkAsReadClan
		}),
		[
			resetCountChannelBadge,
			handleMarkAsReadChannel,
			statusMarkAsReadChannel,
			handleMarkAsReadCategory,
			statusMarkAsReadCategory,
			handleMarkAsReadClan,
			statusMarkAsReadClan
		]
	);
}

function getChannelsWithBadgeCountCategory(cat: ICategoryChannel) {
	const allChannelsAndThreads = cat.channels.flatMap((channel: ChannelThreads) => {
		const threads = channel.threads || [];
		return [channel, ...threads];
	});

	const channelsWithBadge = allChannelsAndThreads.filter(
		(item: ChannelsEntity) =>
			item?.last_seen_message?.timestamp_seconds &&
			item?.last_sent_message?.timestamp_seconds &&
			item.last_seen_message.timestamp_seconds <= item.last_sent_message.timestamp_seconds
	);

	return channelsWithBadge;
}

function getChannelsWithBadgeCountClan(channels: ChannelsEntity[]) {
	const channelsWithBadge = channels
		.flat()
		.filter(
			(item: ChannelsEntity) =>
				item?.last_seen_message?.timestamp_seconds &&
				item?.last_sent_message?.timestamp_seconds &&
				item.last_seen_message?.timestamp_seconds <= item.last_sent_message?.timestamp_seconds
		);

	return channelsWithBadge;
}

function getThreadWithBadgeCount(channel: ChannelThreads) {
	const getThreads = channel.threads;
	const getThreadsWithBadge = getThreads
		?.flat()
		.filter(
			(item: ChannelsEntity) =>
				item?.last_seen_message?.timestamp_seconds &&
				item?.last_sent_message?.timestamp_seconds &&
				item.last_seen_message?.timestamp_seconds <= item.last_sent_message?.timestamp_seconds
		);

	return getThreadsWithBadge;
}

export function useResetCountChannelBadge() {
	const dispatch = useAppDispatch();

	const resetCountChannelBadge = useCallback(
		(channel: ChannelsEntity) => {
			if (!channel) return;
			const timestamp = Date.now() / 1000;
			dispatch(
				channelMetaActions.setChannelLastSeenTimestamp({
					channelId: channel?.channel_id ?? '',
					timestamp: timestamp + TIME_OFFSET
				})
			);

			dispatch(
				clansActions.updateClanBadgeCount({
					clanId: channel?.clan_id ?? '',
					count: (channel?.count_mess_unread ?? 0) * -1
				})
			);

			dispatch(
				channelsActions.updateChannelBadgeCount({
					channelId: channel?.channel_id ?? '',
					count: 0,
					isReset: true
				})
			);
		},
		[dispatch]
	);

	return resetCountChannelBadge;
}
