import { useGifsStickersEmoji } from '@mezon/core';
import { ILongPressType } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useRef, useState } from 'react';
import GifStickerEmojiButtons from '../../GifsStickerEmojiButtons';
import { useEmojiPopupModal } from '../EmojiPopupModal';

interface ChatBoxToolbarWrapperProps {
	isShowEmojiPicker: boolean;
	hasPermissionEdit: boolean;
	voiceLongPress: ILongPressType;
	isRecording: boolean;
	mode: ChannelStreamMode;
	isTopic: boolean;
	onEmojiSelect?: (emojiId: string, emojiShortname: string) => void;
}

const ChatBoxToolbarWrapper: React.FC<ChatBoxToolbarWrapperProps> = ({
	isShowEmojiPicker = false,
	hasPermissionEdit = true,
	voiceLongPress = {} as ILongPressType,
	isRecording = false,
	mode = ChannelStreamMode.STREAM_MODE_CHANNEL,
	isTopic = false,
	onEmojiSelect
}) => {
	const [isEmojiPopupVisible, setIsEmojiPopupVisible] = useState<boolean>(false);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const { setSubPanelActive, subPanelActive } = useGifsStickersEmoji();

	const { toggleEmojiPopup } = useEmojiPopupModal({
		popupRef,
		mode,
		isEmojiPopupVisible,
		setIsEmojiPopupVisible,
		setSubPanelActive,
		isTopic,
		onEmojiSelect
	});

	return (
		isShowEmojiPicker && (
			<GifStickerEmojiButtons
				activeTab={subPanelActive}
				hasPermissionEdit={hasPermissionEdit}
				voiceLongPress={voiceLongPress}
				isRecording={isRecording}
				onToggleEmojiPopup={toggleEmojiPopup}
				isEmojiPopupVisible={isEmojiPopupVisible}
				isTopic={isTopic}
			/>
		)
	);
};

export default ChatBoxToolbarWrapper;
