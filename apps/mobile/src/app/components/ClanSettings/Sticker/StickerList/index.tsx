import { size } from '@mezon/mobile-ui';
import { ClanSticker } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import { StickerSettingItem } from '../StickerItem';

type StickerListProps = {
	listSticker: ClanSticker[];
	clanID: string;
	ListHeaderComponent: any;
};

// Memoize the StickerSettingItem for better performance
const MemoizedStickerItem = memo(StickerSettingItem);

export const StickerList = memo(({ listSticker, clanID, ListHeaderComponent }: StickerListProps) => {
	const row = useMemo(() => ({}), []); // Use object instead of array for better lookup
	let prevOpenedRow: { close: () => void };

	const closeRow = useCallback(
		(id: string) => {
			if (prevOpenedRow && prevOpenedRow !== row[id]) {
				prevOpenedRow.close();
			}
			prevOpenedRow = row[id];
		},
		[row]
	);

	const handleSwipe = useCallback(
		(item: ClanSticker) => {
			closeRow(item.id);
		},
		[closeRow]
	);

	const keyExtractor = useCallback((item: ClanSticker) => `sticker_${item?.clanId}_${item?.id}`, []);

	const handleRef = useCallback(
		(id: string) => (ref: any) => {
			if (ref) {
				row[id] = ref;
			}
		},
		[row]
	);

	const getItemLayout = useCallback(
		(data: any, index: number) => ({
			length: size.s_60,
			offset: size.s_60 * index,
			index
		}),
		[]
	);

	const renderItem = useCallback(
		({ item }) => {
			return <MemoizedStickerItem data={item} clanID={clanID} ref={handleRef(item.id)} onSwipeOpen={handleSwipe} />;
		},
		[clanID, handleRef, handleSwipe]
	);

	return (
		<FlatList
			data={listSticker}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			getItemLayout={getItemLayout}
			removeClippedSubviews={true}
			maxToRenderPerBatch={10}
			updateCellsBatchingPeriod={50}
			windowSize={5}
			initialNumToRender={10}
			ListHeaderComponent={ListHeaderComponent}
		/>
	);
});
