import { canvasAPIActions, channelsActions, threadsActions, topicsActions } from '@mezon/store';
import { notificationService } from '@mezon/utils';
import { ShouldRevalidateFunction } from 'react-router-dom';
import { CustomLoaderFunction } from './appLoader';

export const channelLoader: CustomLoaderFunction = async ({ params, request, dispatch }) => {
	const { channelId, clanId } = params;
	const messageId = new URL(request.url).searchParams.get('messageId');
	if (!channelId || !clanId) {
		throw new Error('Channel ID null');
	}
	dispatch(channelsActions.addThreadToChannels({ channelId, clanId }));
	dispatch(channelsActions.joinChannel({ clanId, channelId, noFetchMembers: false, messageId: messageId || '' }));
	dispatch(channelsActions.setPreviousChannels({ clanId, channelId }));
	notificationService.setCurrentChannelId(channelId);
	dispatch(canvasAPIActions.getChannelCanvasList({ channel_id: channelId, clan_id: clanId }));
	dispatch(topicsActions.setIsShowCreateTopic(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	dispatch(topicsActions.setFocusTopicBox(false));
	dispatch(threadsActions.setFocusThreadBox(false));
	return null;
};

export const shouldRevalidateChannel: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams, currentUrl, nextUrl } = ctx;

	const currentMessageId = new URL(currentUrl).searchParams.get('messageId');
	const nextMessageId = new URL(nextUrl).searchParams.get('messageId');

	const { channelId: currentChannelId } = currentParams;
	const { channelId: nextChannelId } = nextParams;

	return currentChannelId !== nextChannelId || currentMessageId !== nextMessageId;
};
