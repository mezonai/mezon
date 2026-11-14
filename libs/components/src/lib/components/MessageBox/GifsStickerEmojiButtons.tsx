import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { reactionActions, referencesActions, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import type { ILongPressType } from '@mezon/utils';
import { SubPanelName, generateE2eId } from '@mezon/utils';
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
};

const GifStickerEmojiButtons = memo(
	({ hasPermissionEdit, voiceLongPress, isRecording, onToggleEmojiPopup, isTopic, isThreadbox }: GifStickerEmojiButtonsProps) => {
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
						data-e2e={generateE2eId('mention.button.sound')}
					>
						<MezonIcon
							icon={MzIcons20.mzMic}
							className={`${isRecording ? 'text-red-600' : 'text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]'}`}
						/>
					</div>
				)}

				{!isThreadbox && (
					<div
						onClick={handleOpenGifs}
						className={`block text-theme-primary-hover max-sm:hidden w-5 h-5 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
						data-e2e={generateE2eId('mention.button.gif')}
					>
						<MezonIcon
							icon={MzIcons20.mzGif}
							className={`${subPanelActive === SubPanelName.GIFS ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}`}
						/>
					</div>
				)}

				{!isThreadbox && (
					<div
						onClick={handleOpenStickers}
						className={`block text-theme-primary-hover max-sm:hidden w-5 h-5 ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'} group/mzi`}
						data-e2e={generateE2eId('mention.button.sticker')}
					>
						<MezonIcon
							icon={MzIcons20.mzSticker}
							className={`group-hover/mzi:text-[var(--mz-icon-selected)] ${subPanelActive === SubPanelName.STICKERS ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}`}
						/>
					</div>
				)}

				<div
					onClick={handleOpenEmoji}
					className={`w-5 h-5 ${
						subPanelActive === SubPanelName.EMOJI ? 'text-theme-primary-active' : 'text-theme-primary text-theme-primary-hover'
					} ${cursorPointer ? 'cursor-pointer' : 'cursor-not-allowed'}`}
					data-e2e={generateE2eId('mention.button.emoji')}
				>
					<MezonIcon icon={MzIcons20.mzEmoji} className="text-inherit" />
				</div>
			</div>
		);
	}
);

export default GifStickerEmojiButtons;
