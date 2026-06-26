import { channelsActions, clansActions, threadsActions, topicsActions } from '@mezon/store';
import { ModeResponsive } from '@mezon/utils';
import type { ShouldRevalidateFunction } from 'react-router-dom';
import type { CustomLoaderFunction } from './appLoader';

export type ClanLoaderData = {
	clanId: string;
};

export const clanLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { clanId } = params;
	if (!clanId) {
		throw new Error('Clan ID null');
	}

	dispatch(clansActions.joinClan({ clanId }));
	dispatch(clansActions.changeCurrentClan({ clanId }));
	dispatch(channelsActions.setModeResponsive({ clanId, mode: ModeResponsive.MODE_CLAN }));
	dispatch(topicsActions.setIsShowCreateTopic(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	dispatch(topicsActions.setFocusTopicBox(false));
	dispatch(threadsActions.setFocusThreadBox(false));
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
