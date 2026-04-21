import { appActions, channelsActions, quickMenuActions, threadsActions, topicsActions } from '@mezon/store';
import { QUICK_MENU_TYPE, notificationService } from '@mezon/utils';
import type { ShouldRevalidateFunction } from 'react-router-dom';
import type { CustomLoaderFunction } from './appLoader';

export const channelLoader: CustomLoaderFunction = async ({ params, request, dispatch }) => {
	const { channelId, clanId, canvasId } = params;
	const messageId = new URL(request.url).searchParams.get('messageId');
	if (!channelId || !clanId) {
		throw new Error('Channel ID null');
	}

	dispatch(quickMenuActions.listQuickMenuAccess({ channelId, menuType: QUICK_MENU_TYPE.QUICK_MENU }));
	dispatch(channelsActions.addThreadToChannels({ channelId, clanId }));
	dispatch(channelsActions.joinChannel({ clanId, channelId, noFetchMembers: false, messageId: messageId || '' }));
	dispatch(channelsActions.setPreviousChannels({ clanId, channelId }));
	notificationService.setCurrentChannelId(channelId);
	dispatch(topicsActions.setIsShowCreateTopic(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	if (!canvasId) {
		dispatch(appActions.setIsShowCanvas(false));
	}
	dispatch(topicsActions.setFocusTopicBox(false));
	dispatch(threadsActions.setFocusThreadBox(false));
	dispatch(threadsActions.hideThreadModal());
	dispatch(appActions.setHistory(`/chat/clans/${clanId}/channels/${channelId}`));
	return null;
};

export const shouldRevalidateChannel: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams } = ctx;
	const { channelId: currentChannelId } = currentParams;
	const { channelId: nextChannelId } = nextParams;
	return currentChannelId !== nextChannelId;
};
