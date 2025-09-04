import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { reactionActions, referencesActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { E2eKeyType } from '@mezon/utils';
import { ILongPressType, SubPanelName, generateE2eId } from '@mezon/utils';
import { memo, useCallback } from 'react';

export type GifStickerEmojiButtonsProps = {
	activeTab: SubPanelName;
	hasPermissionEdit: boolean;
	voiceLongPress?: ILongPressType;
	isRecording?: boolean;
	onToggleEmojiPopup?: (isVisible: boolean, event?: React.MouseEvent) => void;
	isEmojiPopupVisible?: boolean;
	isTopic: boolean;
	isThreadbox: boolean;
	dataE2E?: {
		gif: E2eKeyType;
		sticker: E2eKeyType;
		emoji: E2eKeyType;
		mic: E2eKeyType;
	};
};

const GifStickerEmojiButtons = memo(
	({ hasPermissionEdit, voiceLongPress, isRecording, onToggleEmojiPopup, isTopic, isThreadbox, dataE2E }: GifStickerEmojiButtonsProps) => {
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
			<div className="flex flex-row absolute h-11 items-center gap-2 top-0 right-3 z-20">
				{!isTopic && !isThreadbox && (
					<div
						{...voiceLongPress}
						className={`w-5 h-5 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
						data-e2e={dataE2E && generateE2eId(dataE2E.mic)}
					>
						<Icons.MicEnable className={`w-5 h-5 ${isRecording ? 'text-red-600' : 'text-theme-primary text-theme-primary-hover'} `} />
					</div>
				)}

				{!isThreadbox && (
					<div
						onClick={handleOpenGifs}
						className={`block text-theme-primary-hover
						} max-sm:hidden w-5 h-5 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
						data-e2e={dataE2E && generateE2eId(dataE2E.gif)}
					>
						<Icons.Gif
							className={`w-5 h-5 ${subPanelActive === SubPanelName.GIFS ? 'text-theme-primary-active' : 'text-theme-primary'}`}
						/>
					</div>
				)}

				{!isThreadbox && (
					<div
						onClick={handleOpenStickers}
						className={`block text-theme-primary-hover
						} max-sm:hidden w-5 h-5 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
						data-e2e={dataE2E && generateE2eId(dataE2E.sticker)}
					>
						<Icons.Sticker
							className={`w-5 h-5 ${subPanelActive === SubPanelName.STICKERS ? 'text-theme-primary-active' : 'text-theme-primary'}`}
						/>
					</div>
				)}

				<div
					onClick={handleOpenEmoji}
					className={`w-5 h-5 text-theme-primary-hover  ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
					data-e2e={dataE2E && generateE2eId(dataE2E.emoji)}
				>
					<Icons.Smile
						className={`w-5 h-5 ${subPanelActive === SubPanelName.EMOJI ? 'text-theme-primary-active' : 'text-theme-primary'}`}
					/>
				</div>
			</div>
		);
	}
);

export default GifStickerEmojiButtons;
