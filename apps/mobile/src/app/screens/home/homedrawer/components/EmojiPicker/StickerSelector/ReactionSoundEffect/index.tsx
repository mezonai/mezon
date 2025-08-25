import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { MediaType, selectAllStickerSuggestion, useAppSelector } from '@mezon/store-mobile';
import { ClanSticker } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import Sticker from '../Sticker';
import { style } from '../styles';

interface StickerWithMediaType extends ClanSticker {
	media_type?: MediaType;
}

type StickerSelectorProps = {
	onSelected?: (soundId: string) => void;
};

const StickerSelector = ({ onSelected }: StickerSelectorProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [selectedCategory, setSelectedCategory] = useState(null);
	const allStickers = useAppSelector(selectAllStickerSuggestion);

	const clanSoundEffect = useMemo(() => {
		if (!allStickers?.length) return [];

		try {
			return allStickers.filter((sticker: StickerWithMediaType) => sticker?.media_type === MediaType.AUDIO);
		} catch (error) {
			console.error('Error get list clanSoundEffect:', error);
			return [];
		}
	}, [allStickers]);

	const categoryLogo = useMemo(() => {
		if (!clanSoundEffect?.length) return [];
		const uniqueMap = new Map();

		try {
			clanSoundEffect.forEach((sound) => {
				const key = sound?.clan_id;
				if (!uniqueMap.has(key)) {
					uniqueMap.set(key, {
						id: sound?.clan_id,
						type: sound?.clan_name,
						url: sound?.logo,
						forSale: false
					});
				}
			});

			return Array.from(uniqueMap.values());
		} catch (error) {
			console.error('Error get list categoryLogo:', error);
			return [];
		}
	}, [clanSoundEffect]);

	const handlePressCategory = (name: string) => {
		setSelectedCategory(name);
	};

	const handleClickSound = useCallback(
		(sound: any) => {
			onSelected(sound?.id);
		},
		[onSelected]
	);

	useEffect(() => {
		return () => {
			setSelectedCategory(null);
		};
	}, []);

	return (
		<ScrollView style={{ paddingHorizontal: size.s_10, paddingBottom: size.s_10 }}>
			<ScrollView horizontal contentContainerStyle={styles.btnWrap}>
				{categoryLogo?.length > 0 &&
					categoryLogo.map((item) => (
						<TouchableOpacity
							key={`key_${item?.id}_${item?.type}`}
							onPress={() => handlePressCategory(item?.type)}
							style={[
								styles.btnEmo,
								{
									backgroundColor: item?.type === selectedCategory ? baseColor.blurple : 'transparent'
								}
							]}
						>
							<View style={styles.btnEmoImage}>
								{item?.url ? (
									<FastImage
										resizeMode={FastImage.resizeMode.cover}
										source={{
											uri: item?.url,
											cache: FastImage.cacheControl.immutable,
											priority: FastImage.priority.high
										}}
										style={{ height: '100%', width: '100%' }}
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
					categoryLogo.map((item) => (
						<Sticker
							key={`sound_${item?.id}_${item?.type}`}
							stickerList={clanSoundEffect}
							onClickSticker={handleClickSound}
							categoryName={item?.type}
							isAudio
						/>
					))
				: [
						<Sticker
							key={`selected_sound_${selectedCategory?.id}_${selectedCategory?.type}`}
							stickerList={clanSoundEffect}
							onClickSticker={handleClickSound}
							categoryName={selectedCategory}
							isAudio
						/>
					]}
		</ScrollView>
	);
};

export default memo(StickerSelector);
