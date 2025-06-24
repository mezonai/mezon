import { Metrics, size, useTheme } from '@mezon/mobile-ui';
import { MediaType, selectAllStickerSuggestion, selectCurrentClan, useAppSelector } from '@mezon/store';
import { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import Sticker from './Sticker';
import { style } from './styles';

type StickerSelectorProps = {
	onSelected?: (url: string) => void;
	onScroll?: (e: any) => void;
	mediaType?: MediaType;
};

export default function StickerSelector({ onSelected, onScroll, mediaType = MediaType.STICKER }: StickerSelectorProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [selectedType, setSelectedType] = useState('');

	const currentClan = useAppSelector(selectCurrentClan);
	const allStickers = useAppSelector(selectAllStickerSuggestion);

	const clanStickers = useMemo(() => {
		if (mediaType === MediaType.AUDIO) {
			return allStickers?.filter((sticker) => (sticker as any).media_type === MediaType.AUDIO);
		}
		return allStickers?.filter((sticker) => (sticker as any).media_type === undefined || (sticker as any).media_type === MediaType.STICKER);
	}, [allStickers, mediaType]);

	useEffect(() => {
		setSelectedType('');
	}, [mediaType]);

	const categoryLogo = clanStickers
		.map((sticker) => ({
			id: sticker.clan_id,
			type: sticker.clan_name,
			url: sticker.logo
		}))
		.filter((sticker, index, self) => index === self.findIndex((s) => s.id === sticker.id));

	const stickers = useMemo(
		() =>
			[
				...clanStickers.map((sticker) => ({
					id: sticker.id,
					url: sticker.source,
					type: sticker.clan_name,
					name: sticker.shortname
				}))
			].filter(Boolean),
		[clanStickers]
	);

	function handlePressCategory(name: string) {
		setSelectedType(name);
	}

	const handleClickImage = (sticker: any) => {
		onSelected && onSelected(sticker);
	};

	const isAudio = mediaType === MediaType.AUDIO;

	return (
		<ScrollView
			scrollEventThrottle={16}
			onScroll={onScroll}
			style={{ maxHeight: Metrics.screenHeight / 1.07 }}
			contentContainerStyle={{ paddingBottom: size.s_10 * 2 }}
		>
			<ScrollView horizontal contentContainerStyle={styles.btnWrap}>
				{categoryLogo?.map((item, index) => (
					<TouchableOpacity key={index.toString()} onPress={() => handlePressCategory(item.type)} style={styles.btnEmo}>
						<FastImage
							resizeMode={FastImage.resizeMode.cover}
							source={{
								uri: item?.url || currentClan?.logo || '',
								cache: FastImage.cacheControl.immutable,
								priority: FastImage.priority.high
							}}
							style={{ height: '100%', width: '100%' }}
						/>
					</TouchableOpacity>
				))}
			</ScrollView>

			{!selectedType
				? categoryLogo?.map((item, index) => (
						<Sticker
							key={`${index}_${item.type}`}
							stickerList={stickers}
							onClickSticker={handleClickImage}
							categoryName={item.type}
							isAudio={isAudio}
						/>
					))
				: [
						<Sticker
							key={`selected_${selectedType}`}
							stickerList={stickers}
							onClickSticker={handleClickImage}
							categoryName={selectedType}
							isAudio={isAudio}
						/>
					]}
		</ScrollView>
	);
}
