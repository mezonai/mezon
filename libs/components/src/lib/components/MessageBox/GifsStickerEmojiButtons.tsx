import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { reactionActions, referencesActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ILongPressType, SubPanelName } from '@mezon/utils';
import { memo, useCallback } from 'react';

export type GifStickerEmojiButtonsProps = {
	activeTab: SubPanelName;
	hasPermissionEdit: boolean;
	voiceLongPress?: ILongPressType;
	isRecording?: boolean;
	onToggleEmojiPopup?: (isVisible: boolean, event?: React.MouseEvent) => void;
	isEmojiPopupVisible?: boolean;
	isTopic: boolean;
};

const GifStickerEmojiButtons = memo(
	({ hasPermissionEdit, voiceLongPress, isRecording, onToggleEmojiPopup, isTopic }: GifStickerEmojiButtonsProps) => {
		const dispatch = useAppDispatch();
		const { setSubPanelActive, subPanelActive } = useGifsStickersEmoji();
		const { setShowCategories, setClickedTrendingGif, setButtonArrowBack } = useGifs();
		const { setValueInputSearch } = useGifsStickersEmoji();

		const handleOpenGifs = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				e.stopPropagation();
				setShowCategories(true);
				setValueInputSearch('');
				setClickedTrendingGif(false);
				setButtonArrowBack(false);
				dispatch(reactionActions.setReactionRightState(false));
				dispatch(referencesActions.setIdReferenceMessageReaction(''));
				const newState = subPanelActive === SubPanelName.GIFS ? SubPanelName.NONE : SubPanelName.GIFS;
				setSubPanelActive(newState);
				if (onToggleEmojiPopup) {
					onToggleEmojiPopup(newState !== SubPanelName.NONE, e);
				}
			},
			[subPanelActive, setSubPanelActive, dispatch, onToggleEmojiPopup]
		);

		const handleOpenStickers = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				e.stopPropagation();
				setShowCategories(true);
				setValueInputSearch('');
				setClickedTrendingGif(false);
				setButtonArrowBack(false);
				dispatch(reactionActions.setReactionRightState(false));
				dispatch(referencesActions.setIdReferenceMessageReaction(''));

				const newState = subPanelActive === SubPanelName.STICKERS ? SubPanelName.NONE : SubPanelName.STICKERS;
				setSubPanelActive(newState);
				if (onToggleEmojiPopup) {
					onToggleEmojiPopup(newState !== SubPanelName.NONE, e);
				}
			},
			[subPanelActive, setSubPanelActive, dispatch, onToggleEmojiPopup]
		);

		const handleOpenEmoji = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				e.stopPropagation();

				setShowCategories(true);
				setValueInputSearch('');
				setClickedTrendingGif(false);
				setButtonArrowBack(false);
				dispatch(reactionActions.setReactionRightState(false));
				dispatch(referencesActions.setIdReferenceMessageReaction(''));

				const newState = subPanelActive === SubPanelName.EMOJI ? SubPanelName.NONE : SubPanelName.EMOJI;
				setSubPanelActive(newState);

				if (onToggleEmojiPopup) {
					onToggleEmojiPopup(newState !== SubPanelName.NONE, e);
				}
			},
			[subPanelActive, setSubPanelActive, dispatch, onToggleEmojiPopup]
		);

		const cursorPointer = isTopic || hasPermissionEdit;

		return (
			<div className="flex flex-row absolute h-11 items-center gap-1 mr-3 top-0 right-0">
				{!isTopic && (
					<div {...voiceLongPress} className={`w-6 h-6 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
						<Icons.MicEnable
							className={`w-6 h-6 ${isRecording ? 'text-red-600' : 'dark:text-[#AEAEAE] text-colorTextLightMode dark:hover:text-white hover:text-black'}`}
						/>
					</div>
				)}

				<div onClick={handleOpenGifs} className={`block max-sm:hidden w-6 h-6 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
					<Icons.Gif defaultSize="w-6 h-6" />
				</div>

				<div
					onClick={handleOpenStickers}
					className={`block max-sm:hidden w-6 h-6 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
				>
					<Icons.Sticker defaultSize="w-6 h-6" isWhite={false} />
				</div>

				<div onClick={handleOpenEmoji} className={`w-6 h-6 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
					<Icons.Smile defaultSize="w-6 h-6" defaultFill={`${'#AEAEAE'}`} />
				</div>
			</div>
		);
	}
);

export default GifStickerEmojiButtons;
