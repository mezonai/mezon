import { appActions, clansActions, gifsActions } from '@mezon/store';
import type { CustomLoaderFunction } from './appLoader';
import { waitForSocketConnection } from './socketUtils';

export const mainLoader: CustomLoaderFunction = async ({ dispatch }) => {
	await dispatch(waitForSocketConnection());
	dispatch(clansActions.fetchClans({}));
	dispatch(gifsActions.fetchGifCategories());
	dispatch(gifsActions.fetchGifCategoryFeatured());
	dispatch(appActions.setIsShowPopupQuickMess(false));
	return null;
};

export const shouldRevalidateMain = () => {
	return false;
};
