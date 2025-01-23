import { size } from '@mezon/mobile-ui';
import { FlashList } from '@shopify/flash-list';
import { ClanSticker } from 'mezon-js';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StickerSettingItem } from '../StickerItem';

type StickerListProps = {
	listSticker: ClanSticker[];
	clanID: string;
};

export const StickerList = ({ listSticker, clanID }: StickerListProps) => {
	const row: Array<any> = [];
	let prevOpenedRow: { close: () => void };

	const closeRow = (id: string) => {
		if (prevOpenedRow && prevOpenedRow !== row[parseInt(id)]) {
			prevOpenedRow.close();
		}
		prevOpenedRow = row[parseInt(id)];
	};

	const handleSwipe = useCallback((item: ClanSticker) => {
		closeRow(item.id);
	}, []);

	const renderItem = ({ item }) => {
		return (
			<StickerSettingItem
				data={item}
				clanID={clanID}
				key={`sticker_${clanID}_${item.id}`}
				ref={(ref) => (row[parseInt(item.id)] = ref)}
				onSwipeOpen={handleSwipe}
			/>
		);
	};

	return (
		<View>
			<FlashList data={listSticker} keyExtractor={(item) => item.id} renderItem={renderItem} estimatedItemSize={size.s_60} />
		</View>
	);
};
