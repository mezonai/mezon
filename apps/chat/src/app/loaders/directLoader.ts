import { channelsActions, threadsActions, topicsActions } from '@mezon/store';
import { ModeResponsive } from '@mezon/utils';
import type { CustomLoaderFunction } from './appLoader';

export const directLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	dispatch(channelsActions.setModeResponsive({ clanId: '0', mode: ModeResponsive.MODE_DM }));
	dispatch(topicsActions.setFocusTopicBox(false));
	dispatch(threadsActions.setFocusThreadBox(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	return null;
};
