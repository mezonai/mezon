import { GifStickerEmojiPopup } from '@mezon/components';
import { useGifsStickersEmoji } from '@mezon/core';
import { selectClickedOnTopicStatus } from '@mezon/store';
import { EmojiPlaces, SubPanelName } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo } from 'react';
import { useSelector } from 'react-redux';

const TopicReactionEmojiPanel = () => {
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const { subPanelActive } = useGifsStickersEmoji();
	const isReactionPanelOpen = subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT || subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM;

	if (!isFocusTopicBox || !isReactionPanelOpen) return null;

	return (
		<div
			id="emojiPickerTopic"
			onMouseDown={(event) => event.stopPropagation()}
			className="absolute bottom-20 right-2 z-50 w-[500px] max-w-[calc(100%_-_16px)] max-h-[calc(100%_-_140px)] overflow-auto rounded-lg max-sm:hidden"
		>
			<GifStickerEmojiPopup mode={ChannelStreamMode.STREAM_MODE_CHANNEL} emojiAction={EmojiPlaces.EMOJI_REACTION} isTopic />
		</div>
	);
};

export default memo(TopicReactionEmojiPanel);
