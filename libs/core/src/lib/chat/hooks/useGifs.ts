import { ThunkDispatch } from '@reduxjs/toolkit';
import {
	gifsActions,
	selectAllgifCategory,
	selectButtonArrowBackStatus,
	selectCategoriesStatus,
	selectDataGifsFeatured,
	selectGifsDataSearch,
	selectLoadingStatusGifs,
	selectTrendingClickingStatus,
} from 'libs/store/src/lib/giftStickerEmojiPanel/gifs.slice';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function useGifs() {
	const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
	const dataGifCategories = useSelector(selectAllgifCategory)[0];
	const dataGifsSearch = useSelector(selectGifsDataSearch);
	const dataGifsFeartured = useSelector(selectDataGifsFeatured);
	const loadingStatusGifs = useSelector(selectLoadingStatusGifs);
	const trendingClickingStatus = useSelector(selectTrendingClickingStatus);
	const categoriesStatus = useSelector(selectCategoriesStatus);
	const buttonArrowBackStatus = useSelector(selectButtonArrowBackStatus);

	const fetchGifsDataSearch = useCallback(
		(valueSearch: string) => {
			dispatch(gifsActions.fetchGifsDataSearch(valueSearch));
		},
		[dispatch],
	);

	const fetchGifsDataFeatured = useCallback(() => {
		dispatch(gifsActions.fetchGifCategoryFeatured());
	}, [dispatch]);

	const setClickedTrendingGif = useCallback(
		(status: boolean) => {
			dispatch(gifsActions.setClickedTrendingGif(status));
		},
		[dispatch],
	);

	const setShowCategories = useCallback(
		(status: boolean) => {
			dispatch(gifsActions.setShowCategories(status));
		},
		[dispatch],
	);
	const setButtonArrowBack = useCallback(
		(status: boolean) => {
			dispatch(gifsActions.setButtonArrowBack(status));
		},
		[dispatch],
	);
	return useMemo(
		() => ({
			fetchGifsDataSearch,
			dataGifCategories,
			dataGifsSearch,
			loadingStatusGifs,
			fetchGifsDataFeatured,
			dataGifsFeartured,
			trendingClickingStatus,
			setClickedTrendingGif,
			categoriesStatus,
			setShowCategories,
			buttonArrowBackStatus,
			setButtonArrowBack,
		}),
		[
			dataGifCategories,
			fetchGifsDataSearch,
			dataGifsSearch,
			loadingStatusGifs,
			fetchGifsDataFeatured,
			dataGifsFeartured,
			trendingClickingStatus,
			setClickedTrendingGif,
			categoriesStatus,
			setShowCategories,
			buttonArrowBackStatus,
			setButtonArrowBack,
		],
	);
}
