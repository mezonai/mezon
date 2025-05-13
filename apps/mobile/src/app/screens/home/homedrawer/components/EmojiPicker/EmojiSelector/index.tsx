import { View } from 'react-native';
import EmojiSelectorContainer from '../EmojiSelectorContainer';

type EmojiSelectorProps = {
	onSelected: (emojiId: string, shortname: string) => void;
	searchText?: string;
	isReactMessage?: boolean;
	onScroll?: (e: any) => void;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
};

export default function EmojiSelector({
	onScroll,
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse
}: EmojiSelectorProps) {
	return (
		<View>
			<EmojiSelectorContainer
				onScroll={onScroll}
				handleBottomSheetExpand={handleBottomSheetExpand}
				handleBottomSheetCollapse={handleBottomSheetCollapse}
				onSelected={onSelected}
				isReactMessage={isReactMessage}
			/>
		</View>
	);
}
