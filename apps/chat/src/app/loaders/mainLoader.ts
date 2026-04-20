import { appActions, clansActions, gifsActions } from '@mezon/store';
import type { CustomLoaderFunction } from './appLoader';

export const mainLoader: CustomLoaderFunction = async ({ dispatch }) => {
	dispatch(clansActions.fetchClans({}));
	dispatch(gifsActions.fetchGifCategories());
	dispatch(gifsActions.fetchGifCategoryFeatured());
	dispatch(appActions.setIsShowPopupQuickMess(false));
	return null;
};

export const shouldRevalidateMain = () => {
	return false;
};
