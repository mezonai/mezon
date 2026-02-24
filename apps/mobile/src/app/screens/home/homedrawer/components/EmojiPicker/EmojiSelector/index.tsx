import { useEffect, useState } from 'react';
import EmojiSelectorContainer from '../EmojiSelectorContainer';

type EmojiSelectorProps = {
	onSelected: (emojiId: string, shortname: string, displayName?: string, avatarUrl?: string) => void;
	isReactMessage?: boolean;
	handleBottomSheetExpand?: () => void;
	handleBottomSheetCollapse?: () => void;
	currentChannelId?: string;
	clanId?: string;
};

export default function EmojiSelector({
	onSelected,
	isReactMessage = false,
	handleBottomSheetExpand,
	handleBottomSheetCollapse,
	currentChannelId,
	clanId
}: EmojiSelectorProps) {
	const [isReadyForUse, setIsReadyForUse] = useState<boolean>(false);
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsReadyForUse(true);
		}, 200);
		return () => timer && clearTimeout(timer);
	}, []);
	if (!isReadyForUse) {
		return null;
	}
	return (
		<EmojiSelectorContainer
			handleBottomSheetExpand={handleBottomSheetExpand}
			handleBottomSheetCollapse={handleBottomSheetCollapse}
			onSelected={onSelected}
			isReactMessage={isReactMessage}
			currentChannelId={currentChannelId}
			clanId={clanId}
		/>
	);
}
