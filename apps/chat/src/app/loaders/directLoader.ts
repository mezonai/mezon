import { channelsActions, directActions, emojiSuggestionActions, threadsActions, topicsActions } from '@mezon/store';
import { ModeResponsive } from '@mezon/utils';
import type { CustomLoaderFunction } from './appLoader';
import { waitForSocketConnection } from './socketUtils';

export const directLoader: CustomLoaderFunction = async ({ dispatch }) => {
	await dispatch(waitForSocketConnection());
	dispatch(emojiSuggestionActions.fetchEmoji({ clanId: '0', noCache: false }));
	dispatch(channelsActions.setModeResponsive({ clanId: '0', mode: ModeResponsive.MODE_DM }));
	dispatch(directActions.follower());
	dispatch(topicsActions.setFocusTopicBox(false));
	dispatch(threadsActions.setFocusThreadBox(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	return null;
};
