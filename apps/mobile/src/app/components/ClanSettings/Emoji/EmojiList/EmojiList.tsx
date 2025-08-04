import { size } from '@mezon/mobile-ui';
import { ClanEmoji } from 'mezon-js';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ListRenderItem } from 'react-native';
import { EmojiDetail } from '../EmojiDetail';

type EmojiListProps = {
	emojiList: ClanEmoji[];
	ListHeaderComponent: any;
};

type ListItem = ClanEmoji | { id: string; clan_id?: string };

const MemoizedEmojiDetail = memo(EmojiDetail);

export const EmojiList = ({ emojiList, ListHeaderComponent }: EmojiListProps) => {
	const { t } = useTranslation(['clanEmojiSetting']);
	const row: Array<any> = [];
	let prevOpenedRow: { close: () => void };
	const ITEM_HEIGHT = size.s_60;

	const closeRow = (id: string) => {
		if (prevOpenedRow && prevOpenedRow !== row?.[parseInt(id)]) {
			prevOpenedRow.close();
		}
		prevOpenedRow = row?.[parseInt(id)];
	};

	const handleSwipe = useCallback((item: ClanEmoji) => {
		closeRow(item.id);
	}, []);

	const getItemLayout = useCallback(
		(data: any, index: number) => ({
			length: ITEM_HEIGHT,
			offset: index * ITEM_HEIGHT,
			index
		}),
		[ITEM_HEIGHT]
	);

	const keyExtractor = useCallback((item: ListItem) => `emoji_${item?.clan_id || 'text'}_${item?.id}`, []);

	const renderItem: ListRenderItem<ListItem> = useCallback(
		({ item }) => {
			return (
				<MemoizedEmojiDetail
					item={item as ClanEmoji}
					ref={(ref) => {
						row[parseInt(item?.id)] = ref;
					}}
					onSwipeOpen={handleSwipe}
				/>
			);
		},
		[handleSwipe, row]
	);

	return (
		<FlatList
			data={emojiList}
			keyExtractor={keyExtractor}
			initialNumToRender={5}
			maxToRenderPerBatch={3}
			windowSize={5}
			removeClippedSubviews={true}
			getItemLayout={getItemLayout}
			renderItem={renderItem}
			ListHeaderComponent={ListHeaderComponent}
			keyboardShouldPersistTaps="handled"
			onEndReachedThreshold={0.5}
			maintainVisibleContentPosition={{
				minIndexForVisible: 0,
				autoscrollToTopThreshold: 10
			}}
		/>
	);
};
