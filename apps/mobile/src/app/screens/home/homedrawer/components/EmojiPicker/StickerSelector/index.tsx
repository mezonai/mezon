import { Metrics, size } from '@mezon/mobile-ui';
import { selectAllStickerSuggestion, selectCurrentClan, selectModeResponsive, useAppSelector } from '@mezon/store';
import { ModeResponsive } from '@mezon/utils';
import { useMemo, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ScrollView } from 'react-native-gesture-handler';
import Sticker from './Sticker';
import styles from './styles';

type StickerSelectorProps = {
	onSelected?: (url: string) => void;
	onScroll?: (e: any) => void;
};

export default function StickerSelector({ onSelected, onScroll }: StickerSelectorProps) {
	const [selectedType, setSelectedType] = useState('');

	const currentClan = useAppSelector(selectCurrentClan);
	const clanStickers = useAppSelector(selectAllStickerSuggestion);
	const modeResponsive = useAppSelector(selectModeResponsive);
	const categoryLogo = useMemo(
		() => [...(modeResponsive === ModeResponsive.MODE_CLAN ? [{ id: 0, url: currentClan?.logo, type: 'custom' }] : [])].filter(Boolean),
		[modeResponsive, currentClan?.logo]
	);

	const stickers = useMemo(
		() =>
			[
				...(modeResponsive === ModeResponsive.MODE_CLAN
					? clanStickers.map((sticker) => ({
							id: sticker.id,
							url: sticker.source,
							type: 'custom'
						}))
					: [])
			].filter(Boolean),
		[modeResponsive, clanStickers]
	);

	function handlePressCategory(name: string) {
		setSelectedType(name);
	}

	const handleClickImage = (sticker: any) => {
		onSelected && onSelected(sticker);
	};

	return (
		<ScrollView
			scrollEventThrottle={16}
			onScroll={onScroll}
			style={{ maxHeight: Metrics.screenHeight / 1.07 }}
			contentContainerStyle={{ paddingBottom: size.s_10 * 2 }}
		>
			<ScrollView horizontal contentContainerStyle={styles.btnWrap}>
				{categoryLogo?.map((item, index) => (
					<TouchableOpacity onPress={() => handlePressCategory(item.type)} style={styles.btnEmo} key={index.toString()}>
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

			{!selectedType ? (
				categoryLogo?.map((item, index) => (
					<Sticker key={index.toString() + '_itemCate'} stickerList={stickers} onClickSticker={handleClickImage} categoryName={item.type} />
				))
			) : (
				<Sticker stickerList={stickers} onClickSticker={handleClickImage} categoryName={selectedType} />
			)}
		</ScrollView>
	);
}
