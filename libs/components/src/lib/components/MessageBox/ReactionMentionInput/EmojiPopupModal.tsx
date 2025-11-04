import { EmojiSuggestionProvider, useCurrentInbox } from '@mezon/core';
import { selectSubPanelActive } from '@mezon/store';
import { EmojiPlaces, SubPanelName } from '@mezon/utils';
import type { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import type { RefObject } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { GifStickerEmojiPopup } from '../../GifsStickersEmojis';

interface EmojiPopupModalProps {
	popupRef: RefObject<HTMLDivElement>;
	mode?: ChannelStreamMode;
	isEmojiPopupVisible: boolean;
	setIsEmojiPopupVisible: (visible: boolean) => void;
	setSubPanelActive: (panel: SubPanelName) => void;
	isTopic?: boolean;
	onEmojiSelect?: (emojiId: string, emojiShortname: string) => void;
}

interface EmojiPopupModalReturnType {
	toggleEmojiPopup: (isVisible: boolean, event?: React.MouseEvent) => void;
}

export const useEmojiPopupModal = (props: EmojiPopupModalProps): EmojiPopupModalReturnType => {
	const { popupRef, mode, isEmojiPopupVisible, setIsEmojiPopupVisible, setSubPanelActive, isTopic = false, onEmojiSelect } = props;

	const currentChannel = useCurrentInbox();

	const subPanelActive = useSelector(selectSubPanelActive);
	const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

	const [showEmojiModal, hideEmojiModal] = useModal(() => {
		return (
			<div
				ref={popupRef}
				onClick={(e) => {
					e.stopPropagation();
				}}
				className="fixed top-0 z-30 flex items-end justify-end"
				onMouseDown={(e) => {
					e.stopPropagation();
				}}
			>
				<div
					className="absolute z-10 origin-bottom-right rounded-lg shadow-lg max-sbm:!left-3 max-sbm:!right-3"
					onClick={(e) => e.stopPropagation()}
					style={{
						left: `${clickPosition.x}px`,
						top: `${clickPosition.y}px`
					}}
				>
					<EmojiSuggestionProvider>
						<GifStickerEmojiPopup
							channelOrDirect={currentChannel as ApiChannelDescription}
							emojiAction={EmojiPlaces.EMOJI_EDITOR}
							mode={mode}
							isTopic={isTopic}
							onEmojiSelect={onEmojiSelect}
						/>
					</EmojiSuggestionProvider>
				</div>
			</div>
		);
	}, [currentChannel, mode, setSubPanelActive, clickPosition, isTopic, onEmojiSelect]);

	useEffect(() => {
		if (!isEmojiPopupVisible) {
			hideEmojiModal();
		}
	}, [subPanelActive, isEmojiPopupVisible, showEmojiModal, hideEmojiModal]);

	useEffect(() => {
		if (subPanelActive && subPanelActive === SubPanelName.NONE) {
			hideEmojiModal();
		}
	}, [subPanelActive, hideEmojiModal]);

	const toggleEmojiPopup = useCallback(
		(isVisible: boolean, event?: React.MouseEvent) => {
			setIsEmojiPopupVisible(isVisible);

			if (isVisible && event) {
				const rect = event.currentTarget.getBoundingClientRect();
				const windowWidth = window.innerWidth;
				const windowHeight = window.innerHeight;

				const POPUP_WIDTH = 500;
				const POPUP_HEIGHT = 530;
				const SCREEN_MARGIN = 10;

				let posX = rect.right - POPUP_WIDTH;
				let posY = rect.bottom;

				if (posX < SCREEN_MARGIN) {
					posX = SCREEN_MARGIN;
				}

				if (posX + POPUP_WIDTH > windowWidth - SCREEN_MARGIN) {
					posX = windowWidth - POPUP_WIDTH - SCREEN_MARGIN;
				}

				if (posY + POPUP_HEIGHT > windowHeight - SCREEN_MARGIN) {
					posY = rect.top - POPUP_HEIGHT;
					if (posY < SCREEN_MARGIN) {
						posY = SCREEN_MARGIN;
					}
				}

				setClickPosition({
					x: posX,
					y: posY
				});

				setTimeout(() => {
					showEmojiModal();
				}, 100);
			}

			if (!isVisible) {
				setSubPanelActive(SubPanelName.NONE);
			}
		},
		[setSubPanelActive, setIsEmojiPopupVisible]
	);

	return { toggleEmojiPopup };
};
