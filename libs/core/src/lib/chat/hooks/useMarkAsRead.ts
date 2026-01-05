import type { ChannelsEntity, RootState } from '@mezon/store';
import {
	EMarkAsReadType,
	channelMetaActions,
	channelsActions,
	clansActions,
	getStore,
	listChannelRenderAction,
	listChannelsByUserActions,
	markAsReadProcessing,
	selectAllChannels,
	selectChannelThreads,
	selectLastSentMessageStateByChannelId,
	selectLatestMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ChannelThreads, ICategoryChannel } from '@mezon/utils';
import type { ApiMarkAsReadRequest } from 'mezon-js/types';
import { useCallback, useMemo, useState } from 'react';

export function useMarkAsRead() {
	const dispatch = useAppDispatch();
	const [statusMarkAsReadChannel, setStatusMarkAsReadChannel] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadCategory, setStatusMarkAsReadCategory] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadClan, setStatusMarkAsReadClan] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const channelsInClan = useAppSelector(selectAllChannels);

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
				clanId: '',
				categoryId: '',
				channelId: channelId
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
				clanId: channel.clanId,
				categoryId: channel.categoryId,
				channelId: channel.channelId
			};

			setStatusMarkAsReadChannel('pending');

			try {
				await actionMarkAsRead(body);

				setStatusMarkAsReadChannel('success');
				const allThreadsInChannel = [channel, ...getThreadWithBadgeCount(channel)];
				const channelIds = allThreadsInChannel.map((item) => item.id);
				const store = getStore();
				const channelUpdates = channelIds.map((channelId) => {
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
				dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
				dispatch(
					channelsActions.resetChannelsCount({
						clanId: channel?.clanId as string,
						channelIds
					})
				);
				dispatch(
					clansActions.updateClanBadgeCountFromChannels({
						clanId: channel.clanId as string,
						channels: allThreadsInChannel.map((channel) => ({
							channelId: channel.id,
							count: (channel.count_mess_unread ?? 0) * -1
						}))
					})
				);
				dispatch(
					listChannelRenderAction.handleMarkAsReadListRender({
						type: EMarkAsReadType.CHANNEL,
						channelId: channel.id,
						clanId: channel.clanId as string
					})
				);
				const threadIds: string[] = [];
				allThreadsInChannel.map((channel) => {
					if (channel.threadIds?.length) {
						threadIds.push(...channel.threadIds);
					}
				});
				if (threadIds.length) {
					const threadUpdates = threadIds.map((channelId) => {
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
					dispatch(channelMetaActions.setChannelsLastSeenTimestamp(threadUpdates));
				}

				dispatch(listChannelsByUserActions.markAsReadChannel([channel.id, ...threadIds]));
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadChannel('error');
			}
		},
		[actionMarkAsRead]
	);

	const handleMarkAsReadCategory = useCallback(
		async (category: ICategoryChannel) => {
			const body: ApiMarkAsReadRequest = {
				clanId: category.clanId,
				categoryId: category.categoryId
			};

			const store = getStore();

			const channelsInCategory = selectChannelThreads(store.getState() as RootState)?.filter(
				(channel) => channel.categoryId === category.categoryId
			);

			setStatusMarkAsReadCategory('pending');
			try {
				await actionMarkAsRead(body);
				const allChannelsAndThreads = channelsInCategory.flatMap((channel) => [channel, ...(channel.threads || [])]);
				setStatusMarkAsReadCategory('success');
				const channelIds = allChannelsAndThreads.map((item) => item.id);
				const channelUpdates = channelIds.map((channelId) => {
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
				dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelUpdates));
				dispatch(
					channelsActions.resetChannelsCount({
						clanId: category.clanId as string,
						channelIds
					})
				);
				dispatch(
					listChannelRenderAction.handleMarkAsReadListRender({
						type: EMarkAsReadType.CATEGORY,
						clanId: category.clanId as string,
						categoryId: category.id
					})
				);
				dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));

				dispatch(
					clansActions.updateHasUnreadBasedOnChannels({
						clanId: category.clanId as string
					})
				);
			} catch (error) {
				console.error('Failed to mark as read:', error);
				setStatusMarkAsReadCategory('error');
			}
		},
		[actionMarkAsRead]
	);
	const handleMarkAsReadClan = useCallback(
		async (clanId: string) => {
			const body: ApiMarkAsReadRequest = {
				clanId: clanId ?? ''
			};
			setStatusMarkAsReadClan('pending');
			try {
				await actionMarkAsRead(body);
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
		[actionMarkAsRead, channelsInClan]
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
