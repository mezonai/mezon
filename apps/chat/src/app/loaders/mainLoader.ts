import { appActions, clansActions } from '@mezon/store';
import type { CustomLoaderFunction } from './appLoader';

export const mainLoader: CustomLoaderFunction = async ({ dispatch }) => {
	dispatch(clansActions.fetchClans({}));
	dispatch(appActions.setIsShowPopupQuickMess(false));
	return null;
};

export const shouldRevalidateMain = () => {
	return false;
};
