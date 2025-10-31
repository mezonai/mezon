import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import GifCategory from './GifCategory';
import GiftItem from './GifItem';
import styles from './styles';

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
		<ScrollView scrollEventThrottle={16} onScroll={onScroll} style={styles.scrollViewStyle} contentContainerStyle={styles.scrollViewContent}>
			{valueInputToCheckHandleSearch === '' ? (
				<GifCategory loading={loadingStatusGifs === 'loading'} data={dataGifCategories} />
			) : (
				<GiftItem loading={loadingStatusGifs === 'loading'} data={gifData} onPress={handleGifPress} />
			)}
		</ScrollView>
	);
}
