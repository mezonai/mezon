import { channelsActions, emojiSuggestionActions, topicsActions } from '@mezon/store';
import { ModeResponsive } from '@mezon/utils';
import { CustomLoaderFunction } from './appLoader';

export const directLoader: CustomLoaderFunction = async ({ dispatch }) => {
	dispatch(emojiSuggestionActions.fetchEmoji({}));
	dispatch(channelsActions.setModeResponsive({ clanId: '0', mode: ModeResponsive.MODE_DM }));
	dispatch(topicsActions.setFocusTopicBox(false));
	dispatch(topicsActions.setCurrentTopicId(''));
	return null;
};
