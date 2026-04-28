import { appActions, channelsActions, directActions, fetchUserChannels } from '@mezon/store';
import { notificationService } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ShouldRevalidateFunction } from 'react-router-dom';
import type { CustomLoaderFunction } from './appLoader';

export const directMessageLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { directId, type } = params;
	if (!directId) {
		throw new Error('DirectMessage ID null');
	}
	if (directId && type && Number(type) === ChannelType.CHANNEL_TYPE_GROUP) {
		dispatch(
			fetchUserChannels({
				channelId: directId,
				isGroup: true
			})
		);
	}
	await dispatch(
		directActions.joinDirectMessage({
			directMessageId: directId,
			channelName: '',
			type: Number(type)
		})
	);
	dispatch(appActions.setHistory(`/chat/direct/message/${directId}/${type}`));
	dispatch(channelsActions.setPreviousChannels({ clanId: '0', channelId: directId }));
	dispatch(directActions.setDmGroupCurrentId(directId));
	notificationService.setCurrentChannelId(directId);

	return null;
};

export const shouldRevalidateDirect: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams } = ctx;
	const { directId: currentChannelId } = currentParams;
	const { directId: nextChannelId } = nextParams;

	return currentChannelId !== nextChannelId;
};
