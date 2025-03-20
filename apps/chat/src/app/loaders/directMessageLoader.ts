import { channelsActions, directActions } from '@mezon/store';
import { notificationService } from '@mezon/utils';
import { ShouldRevalidateFunction } from 'react-router-dom';
import { CustomLoaderFunction } from './appLoader';

export const directMessageLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { directId, type } = params;
	if (!directId) {
		throw new Error('DirectMessage ID null');
	}

	await dispatch(
		directActions.joinDirectMessage({
			directMessageId: directId,
			channelName: '',
			type: Number(type)
		})
	);
	dispatch(channelsActions.setPreviousChannels({ clanId: '0', channelId: directId }));
	notificationService.setCurrentChannelId(directId);

	return null;
};

export const shouldRevalidateDirect: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams } = ctx;
	const { directId: currentChannelId } = currentParams;
	const { directId: nextChannelId } = nextParams;

	return currentChannelId !== nextChannelId;
};
