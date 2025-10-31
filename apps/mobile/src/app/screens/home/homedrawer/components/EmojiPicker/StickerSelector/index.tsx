import { useTheme } from '@mezon/mobile-ui';
import { MediaType, selectAllStickerSuggestion, useAppSelector } from '@mezon/store-mobile';
import { FOR_SALE_CATE } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import { memo, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import EmptySticker from './EmptySticker';
import Sticker from './Sticker';
import { style } from './styles';

type StickerSelectorProps = {
	onSelected?: (url: string) => void;
	onScroll?: (e: any) => void;
	mediaType?: MediaType;
	searchText?: string;
};

const StickerSelector = ({ onSelected, onScroll, mediaType = MediaType.STICKER, searchText }: StickerSelectorProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [selectedCategory, setSelectedCategory] = useState(null);

	const isAudio = useMemo(() => mediaType === MediaType.AUDIO, [mediaType]);
	const allStickers = useAppSelector(selectAllStickerSuggestion);

	const clanStickers = useMemo(() => {
		if (mediaType === MediaType.AUDIO) {
			return allStickers?.filter((sticker) => (sticker as any).media_type === MediaType.AUDIO);
		}
		return allStickers?.filter((sticker) => (sticker as any).media_type === undefined || (sticker as any).media_type === MediaType.STICKER);
	}, [mediaType, allStickers]);

	const filteredStickers = useMemo(() => {
		if (!searchText?.trim()) return clanStickers;

		const lowerCaseSearchTerm = searchText.trim().toLowerCase();
		return clanStickers?.filter((item) => item?.shortname?.toLowerCase().includes(lowerCaseSearchTerm));
	}, [clanStickers, searchText]);

	const categoryLogo = useMemo(() => {
		if (filteredStickers?.length === 0) return [];

		const uniqueCategories = new Map();
		const result = [
			{
				id: Snowflake.generate(),
				type: FOR_SALE_CATE,
				url: '',
				forSale: true
			}
		];

		for (const sticker of filteredStickers) {
			const item = {
				id: sticker?.clan_id,
				type: sticker?.clan_name,
				url: sticker?.logo,
				forSale: false
			};

			const key = `${item?.id}_${item?.type}_${item?.forSale}`;

			if (!uniqueCategories.has(key)) {
				uniqueCategories.set(key, true);
				result.push(item);
			}
		}

		return result;
	}, [filteredStickers]);

	const handlePressCategory = (category: any) => {
		if (category?.id === selectedCategory?.id) {
			setSelectedCategory(null);
			return;
		}
		setSelectedCategory(category);
	};

	const handleClickImage = (sticker: any) => {
		onSelected && onSelected(sticker);
	};

	useEffect(() => {
		setSelectedCategory(null);
	}, [mediaType]);

	if (!filteredStickers?.length) {
		return <EmptySticker isAudio={isAudio} />;
	}

	return (
		<ScrollView scrollEventThrottle={16} onScroll={onScroll} style={styles.scrollView} contentContainerStyle={styles.scrollViewContainer}>
			<ScrollView horizontal contentContainerStyle={styles.btnWrap}>
				{categoryLogo?.length > 0 &&
					categoryLogo?.map((item, index) => (
						<TouchableOpacity
							key={index.toString()}
							onPress={() => handlePressCategory(item)}
							style={[styles.btnEmo, item?.id === selectedCategory?.id ? styles.btnEmoSelected : styles.btnEmoUnselected]}
						>
							<View style={styles.btnEmoImage}>
								{item?.forSale ? (
									<View style={styles.btnEmoActive}>
										<MezonIconCDN icon={IconCDN.shopSparkleIcon} color={themeValue.textStrong} />
									</View>
								) : item?.url ? (
									<FastImage
										resizeMode={FastImage.resizeMode.cover}
										source={{
											uri: item?.url,
											cache: FastImage.cacheControl.immutable,
											priority: FastImage.priority.high
										}}
										style={styles.btnEmoImageFull}
									/>
								) : (
									<View style={styles.forSaleContainer}>
										<Text style={styles.forSaleText}>{item?.type?.charAt(0)?.toUpperCase()}</Text>
									</View>
								)}
							</View>
						</TouchableOpacity>
					))}
			</ScrollView>

			{!selectedCategory
				? categoryLogo?.length > 0 &&
					categoryLogo?.map((item, index) => (
						<Sticker
							key={`${index}_${item?.id}_${item?.type}_${item?.forSale}`}
							stickerList={filteredStickers}
							onClickSticker={handleClickImage}
							categoryName={item?.type}
							forSale={item?.forSale}
							isAudio={isAudio}
						/>
					))
				: [
						<Sticker
							key={`selected_${selectedCategory?.id}_${selectedCategory?.type}_${selectedCategory?.forSale}`}
							stickerList={filteredStickers}
							onClickSticker={handleClickImage}
							categoryName={selectedCategory?.type}
							forSale={selectedCategory?.forSale}
							isAudio={isAudio}
						/>
					]}
		</ScrollView>
	);
};

export default memo(StickerSelector);
