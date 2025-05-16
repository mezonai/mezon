import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { Metrics, size } from '@mezon/mobile-ui';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import GifCategory from './GifCategory';
import GiftItem from './GifItem';

type GifSelectorProps = {
	onSelected: (url: string) => void;
	onScroll: (e: any) => void;
	searchText: string;
};

export default function GifSelector({ onSelected, searchText, onScroll }: GifSelectorProps) {
	const [gifData, setGifData] = useState<any>();

	const {
		dataGifCategories,
		dataGifsSearch,
		loadingStatusGifs,
		dataGifsFeartured,
		trendingClickingStatus,
		setButtonArrowBack,
		fetchGifsDataSearch
	} = useGifs();

	const { valueInputToCheckHandleSearch, setValueInputSearch } = useGifsStickersEmoji();

	useEffect(() => {
		if (searchText.length > 0) {
			fetchGifsDataSearch(searchText);
		}

		setValueInputSearch(searchText);
	}, [searchText]);

	useEffect(() => {
		if (dataGifsSearch.length > 0 && valueInputToCheckHandleSearch !== '') {
			setGifData(dataGifsSearch);
		} else if (trendingClickingStatus) {
			setGifData(dataGifsFeartured);
		} else if (valueInputToCheckHandleSearch === '') {
			setButtonArrowBack(false);
		}
	}, [dataGifsSearch, trendingClickingStatus, valueInputToCheckHandleSearch]);

	function handleGifPress(url: string) {
		onSelected && onSelected(url);
	}

	return (
		<ScrollView
			scrollEventThrottle={16}
			onScroll={onScroll}
			style={{ maxHeight: Metrics.screenHeight / 1.07 }}
			contentContainerStyle={{ paddingBottom: size.s_10 * 2 }}
		>
			{valueInputToCheckHandleSearch === '' ? (
				<GifCategory loading={loadingStatusGifs === 'loading'} data={dataGifCategories} />
			) : (
				<GiftItem loading={loadingStatusGifs === 'loading'} data={gifData} onPress={handleGifPress} />
			)}
		</ScrollView>
	);
}
