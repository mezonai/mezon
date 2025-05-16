import EmojiSelectorContainer from '../EmojiSelectorContainer';

type EmojiSelectorProps = {
	onSelected: (emojiId: string, shortname: string) => void;
	searchText?: string;
	isReactMessage?: boolean;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
};

export default function EmojiSelector({
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse
}: EmojiSelectorProps) {
	return (
		<EmojiSelectorContainer
			handleBottomSheetExpand={handleBottomSheetExpand}
			handleBottomSheetCollapse={handleBottomSheetCollapse}
			onSelected={onSelected}
			isReactMessage={isReactMessage}
		/>
	);
}
