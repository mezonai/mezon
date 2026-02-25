import type { ChannelsEntity, RootState } from '@mezon/store';
import {
	badgeService,
	channelMetaActions,
	clansActions,
	getStore,
	markAsReadProcessing,
	selectAllChannels,
	selectChannelThreads,
	selectLastSentMessageStateByChannelId,
	selectLatestMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ChannelThreads, ICategoryChannel } from '@mezon/utils';
import type { ApiMarkAsReadRequest } from 'mezon-js/api.gen';
import { useCallback, useMemo, useState } from 'react';

function buildChannelUpdates(channelIds: string[]): Array<{ channelId: string; messageId?: string }> {
	const store = getStore();
	return channelIds.map((channelId) => {
		let messageId: string | undefined;
		if (store) {
			messageId = selectLatestMessageId(store.getState(), channelId);
			if (!messageId) {
				const lastSentMsg = selectLastSentMessageStateByChannelId(store.getState(), channelId);
				messageId = lastSentMsg?.id;
			}
		}
		return { channelId, messageId };
	});
}

function collectThreadIds(channels: ChannelThreads[]): string[] {
	const threadIds: string[] = [];
	for (const ch of channels) {
		if (ch.threadIds?.length) {
			threadIds.push(...ch.threadIds);
		}
	}
	return threadIds;
}

export function useMarkAsRead() {
	const dispatch = useAppDispatch();
	const [statusMarkAsReadChannel, setStatusMarkAsReadChannel] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadCategory, setStatusMarkAsReadCategory] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadClan, setStatusMarkAsReadClan] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const _channelsInClan = useAppSelector(selectAllChannels);

	const actionMarkAsRead = useCallback(
		async (body: ApiMarkAsReadRequest) => {
			const result = await dispatch(markAsReadProcessing(body));
			return result;
		},
		[dispatch]
	);

	const handleMarkAsReadDM = useCallback(
		async (channelId: string) => {
			const body: ApiMarkAsReadRequest = {
				clan_id: '',
				category_id: '',
				channel_id: channelId
			};

			try {
				await actionMarkAsRead(body);
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadChannel('error');
			}
		},
		[actionMarkAsRead]
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
				await actionMarkAsRead(body);
				setStatusMarkAsReadChannel('success');

				const allThreadsInChannel = [channel, ...getThreadWithBadgeCount(channel)];
				const channelIds = allThreadsInChannel.map((item) => item.id);
				const channelUpdates = buildChannelUpdates(channelIds);

				badgeService.markAsReadChannel(
					channel.clan_id as string,
					channel.id,
					channelIds,
					channelUpdates,
					allThreadsInChannel.map((ch) => ({
						channelId: ch.id,
						count: (ch.count_mess_unread ?? 0) * -1
					}))
				);

				const threadIds = collectThreadIds(allThreadsInChannel);
				if (threadIds.length) {
					const threadUpdates = buildChannelUpdates(threadIds);
					dispatch(channelMetaActions.setChannelsLastSeenTimestamp(threadUpdates));
				}
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadChannel('error');
			}
		},
		[actionMarkAsRead, dispatch]
	);

	const handleMarkAsReadCategory = useCallback(
		async (category: ICategoryChannel) => {
			const body: ApiMarkAsReadRequest = {
				clan_id: category.clan_id,
				category_id: category.category_id
			};

			const store = getStore();
			const channelsInCategory = selectChannelThreads(store.getState() as RootState)?.filter(
				(channel) => channel.category_id === category.category_id
			);

			setStatusMarkAsReadCategory('pending');
			try {
				await actionMarkAsRead(body);
				setStatusMarkAsReadCategory('success');

				const allChannelsAndThreads = channelsInCategory.flatMap((channel) => [channel, ...(channel.threads || [])]);
				const channelIds = allChannelsAndThreads.map((item) => item.id);
				const channelUpdates = buildChannelUpdates(channelIds);

				badgeService.markAsReadCategory(category.clan_id as string, category.category_id ?? '', channelIds, channelUpdates);

				dispatch(
					clansActions.updateHasUnreadBasedOnChannels({
						clanId: category.clan_id as string
					})
				);
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadCategory('error');
			}
		},
		[actionMarkAsRead, dispatch]
	);

	const handleMarkAsReadClan = useCallback(
		async (clanId: string) => {
			const body: ApiMarkAsReadRequest = {
				clan_id: clanId ?? ''
			};

			console.log('handleMarkAsReadClan');

			setStatusMarkAsReadClan('pending');
			try {
				await actionMarkAsRead(body);

				const store = getStore();
				const channels = selectChannelThreads(store.getState() as RootState);
				const channelIds = channels.map((item) => item.id);
				const channelUpdates = buildChannelUpdates(channelIds);

				badgeService.markAsReadClan(clanId, channelIds, channelUpdates);

				dispatch(
					clansActions.setHasUnreadMessage({
						clanId,
						hasUnread: false
					})
				);

				setStatusMarkAsReadClan('success');
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadClan('error');
			}
		},
		[actionMarkAsRead, dispatch]
	);

	return useMemo(
		() => ({
			handleMarkAsReadChannel,
			statusMarkAsReadChannel,
			handleMarkAsReadCategory,
			statusMarkAsReadCategory,
			handleMarkAsReadClan,
			statusMarkAsReadClan,
			handleMarkAsReadDM
		}),
		[
			handleMarkAsReadChannel,
			statusMarkAsReadChannel,
			handleMarkAsReadCategory,
			statusMarkAsReadCategory,
			handleMarkAsReadClan,
			statusMarkAsReadClan,
			handleMarkAsReadDM
		]
	);
}

function getThreadWithBadgeCount(channel: ChannelThreads) {
	return channel.threads || [];
}
