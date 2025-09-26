import {
	channelsActions,
	defaultNotificationCategoryActions,
	getStore,
	selectAllChannels,
	selectChannelById,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDefaultChannelIdByClanId,
	selectThreadsByParentChannelId,
	selectWelcomeChannelByClanId,
	threadsActions,
	useAppDispatch
} from '@mezon/store';
import { checkIsThread } from '@mezon/utils';
import { useSelector } from 'react-redux';
import { useAppNavigation } from '../../app/hooks/useAppNavigation';

export function useChannels() {
	const channels = useSelector(selectAllChannels);
	const { toChannelPage, navigate, toMembersPage } = useAppNavigation();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const dispatch = useAppDispatch();

	const handleConfirmDeleteChannel = async (channelId: string, clanId: string) => {
		const store = getStore();
		const state = store.getState();
		const channelToDelete = selectChannelById(state, channelId);
		const isThread = checkIsThread(channelToDelete);

		if (!isThread && channelToDelete) {
			const allThreadsInChannel = selectThreadsByParentChannelId(state, channelId);

			const currentChannel = currentChannelId ? selectChannelById(state, currentChannelId) : null;
			const isUserInChildThread = currentChannel && checkIsThread(currentChannel) && currentChannel.parent_id === channelId;

			if (isUserInChildThread) {
				const welcomeChannelId = selectWelcomeChannelByClanId(state, clanId);
				const defaultChannelId = selectDefaultChannelIdByClanId(state, clanId);
				const fallbackChannelId = channels.find((ch) => ch.id !== channelId && !checkIsThread(ch))?.id;

				const redirectChannelId = welcomeChannelId || defaultChannelId || fallbackChannelId;

				if (redirectChannelId) {
					const channelPath = toChannelPage(redirectChannelId, clanId);
					navigate(channelPath);
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}
		}

		await dispatch(channelsActions.deleteChannel({ channelId, clanId: clanId as string }));
		dispatch(
			defaultNotificationCategoryActions.fetchChannelCategorySetting({
				clanId: clanId as string,
				noCache: true
			})
		);

		if (isThread && channelToDelete?.parent_id) {
			await dispatch(threadsActions.remove(channelId));
			await dispatch(
				threadsActions.removeThreadFromCache({
					channelId: channelToDelete.parent_id,
					threadId: channelId
				})
			);
		}

		navigateAfterDeleteChannel(channelId);
	};

	const navigateAfterDeleteChannel = (channelId: string) => {
		let channelLink: string;
		if (channelId !== currentChannelId) {
			return;
		}
		if (channels.length === 1) {
			channelLink = toMembersPage(currentClanId as string);
			navigate(channelLink);
			return;
		}
		const nextLink = {
			firstChannel: channels[0].channel_id,
			secondChannel: channels[1].channel_id
		};
		const nextChannel = channelId === nextLink.firstChannel ? nextLink.secondChannel : nextLink.firstChannel;
		channelLink = toChannelPage(nextChannel as string, currentClanId as string);
		navigate(channelLink);
		return;
	};

	return {
		navigateAfterDeleteChannel,
		handleConfirmDeleteChannel
	};
}
