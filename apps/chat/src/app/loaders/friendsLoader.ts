import { acitvitiesActions, directActions } from '@mezon/store';
import type { CustomLoaderFunction } from './appLoader';

export const friendsLoader: CustomLoaderFunction = async ({ dispatch }) => {
	dispatch(directActions.joinDirectMessageSpace({}));
	dispatch(acitvitiesActions.listActivities({}));
	return null;
};
