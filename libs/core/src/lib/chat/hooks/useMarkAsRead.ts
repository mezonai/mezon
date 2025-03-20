import {
	channelMetaActions,
	channelsActions,
	ChannelsEntity,
	clansActions,
	EMarkAsReadType,
	listChannelRenderAction,
	listChannelsByUserActions,
	markAsReadProcessing,
	RootState,
	selectChannelsByClanId,
	selectChannelThreads,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ChannelThreads, ICategoryChannel } from '@mezon/utils';
import { ApiMarkAsReadRequest } from 'mezon-js/api.gen';
import { useCallback, useMemo, useState } from 'react';
import { useStore } from 'react-redux';

export function useMarkAsRead() {
	const store = useStore();
	const dispatch = useAppDispatch();
	const [statusMarkAsReadChannel, setStatusMarkAsReadChannel] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadCategory, setStatusMarkAsReadCategory] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const [statusMarkAsReadClan, setStatusMarkAsReadClan] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
	const currentClanId = useAppSelector(selectCurrentClanId);
	const channelsInClan = useAppSelector((state) => selectChannelsByClanId(state, currentClanId ?? ''));

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
				dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelIds));
				dispatch(
					channelsActions.resetChannelsCount({
						clanId: channel?.clan_id as string,
						channelIds
					})
				);
				dispatch(
					clansActions.updateClanBadgeCount2({
						clanId: channel.clan_id as string,
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
						clanId: channel.clan_id as string
					})
				);
				const threadIds: string[] = [];
				allThreadsInChannel.map((channel) => {
					if (channel.threadIds?.length) {
						threadIds.push(...channel.threadIds);
					}
				});
				if (threadIds.length) {
					dispatch(channelMetaActions.setChannelsLastSeenTimestamp(threadIds));
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
				clan_id: category.clan_id,
				category_id: category.category_id
			};

			const channelsInCategory = selectChannelThreads(store.getState() as RootState)?.filter(
				(channel) => channel.category_id === category.category_id
			);

			setStatusMarkAsReadCategory('pending');
			try {
				await actionMarkAsRead(body);
				const allChannelsAndThreads = channelsInCategory.flatMap((channel) => [channel, ...(channel.threads || [])]);
				setStatusMarkAsReadCategory('success');
				const channelIds = allChannelsAndThreads.map((item) => item.id);
				dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelIds));
				dispatch(
					channelsActions.resetChannelsCount({
						clanId: category.clan_id as string,
						channelIds
					})
				);
				dispatch(
					listChannelRenderAction.handleMarkAsReadListRender({
						type: EMarkAsReadType.CATEGORY,
						clanId: category.clan_id as string,
						categoryId: category.id
					})
				);
				dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
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
				clan_id: clanId ?? ''
			};
			setStatusMarkAsReadClan('pending');
			try {
				await actionMarkAsRead(body);
				setStatusMarkAsReadClan('success');
				const channelIds = channelsInClan.map((item) => item.id);
				dispatch(channelMetaActions.setChannelsLastSeenTimestamp(channelIds));
				dispatch(
					channelsActions.resetChannelsCount({
						clanId,
						channelIds
					})
				);
				dispatch(clansActions.updateClanBadgeCount({ clanId: clanId ?? '', count: 0, isReset: true }));
				dispatch(
					listChannelRenderAction.handleMarkAsReadListRender({
						type: EMarkAsReadType.CLAN,
						clanId: clanId
					})
				);
				dispatch(listChannelsByUserActions.markAsReadChannel(channelIds));
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
