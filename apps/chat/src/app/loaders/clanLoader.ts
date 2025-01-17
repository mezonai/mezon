import {
	appActions,
	channelsActions,
	clansActions,
	emojiSuggestionActions,
	fetchSystemMessageByClanId,
	getAllSFUMembersInChannel,
	topicsActions
} from '@mezon/store';
import { ModeResponsive } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { ShouldRevalidateFunction } from 'react-router-dom';
import { CustomLoaderFunction } from './appLoader';

export type ClanLoaderData = {
	clanId: string;
};

export const clanLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { clanId } = params;
	if (!clanId) {
		throw new Error('Clan ID null');
	}
	dispatch(emojiSuggestionActions.fetchEmoji({}));
	dispatch(clansActions.joinClan({ clanId }));
	dispatch(clansActions.changeCurrentClan({ clanId }));
	dispatch(channelsActions.setModeResponsive({ clanId, mode: ModeResponsive.MODE_CLAN }));
	dispatch(channelsActions.fetchListFavoriteChannel({ clanId: clanId }));
	dispatch(fetchSystemMessageByClanId(clanId));
	dispatch(getAllSFUMembersInChannel({ channelId: '', channelType: ChannelType.CHANNEL_TYPE_CHANNEL, clanId: clanId ?? '' }));
	dispatch(appActions.setIsShowCanvas(false));
	dispatch(topicsActions.setIsShowCreateTopic(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	return {
		clanId
	} as ClanLoaderData;
};

export const shouldRevalidateServer: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams } = ctx;
	const { clanId: currentServerId } = currentParams;
	const { clanId: nextServerId } = nextParams;
	return currentServerId !== nextServerId;
};
