import { useAppParams, useGifs, useGifsStickersEmoji } from '@mezon/core';
import { reactionActions, referencesActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ILongPressType, SubPanelName } from '@mezon/utils';
import { memo, useCallback } from 'react';

export type GifStickerEmojiButtonsProps = {
	activeTab: SubPanelName;
	currentClanId?: string;
	hasPermissionEdit: boolean;
	voiceLongPress?: ILongPressType;
	isRecording?: boolean;
};

const GifStickerEmojiButtons = memo(({ activeTab, currentClanId, hasPermissionEdit, voiceLongPress, isRecording }: GifStickerEmojiButtonsProps) => {
	const dispatch = useAppDispatch();
	const { setSubPanelActive, subPanelActive } = useGifsStickersEmoji();
	const { setShowCategories } = useGifs();
	const { setValueInputSearch } = useGifsStickersEmoji();
	const { directId: currentDmGroupId } = useAppParams();

	const handleOpenGifs = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			setSubPanelActive(SubPanelName.GIFS);
			setShowCategories(true);
			setValueInputSearch('');
			dispatch(reactionActions.setReactionRightState(false));
			dispatch(reactionActions.setReactionBottomState(false));
			if (subPanelActive === SubPanelName.GIFS) {
				setSubPanelActive(SubPanelName.NONE);
			} else {
				setSubPanelActive(SubPanelName.GIFS);
			}
			dispatch(referencesActions.setIdReferenceMessageReaction(''));
		},
		[subPanelActive, setSubPanelActive]
	);

	const handleOpenStickers = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			setSubPanelActive(SubPanelName.STICKERS);
			setShowCategories(true);
			setValueInputSearch('');

			dispatch(reactionActions.setReactionRightState(false));
			dispatch(reactionActions.setReactionBottomState(false));
			if (subPanelActive === SubPanelName.STICKERS) {
				setSubPanelActive(SubPanelName.NONE);
			} else {
				setSubPanelActive(SubPanelName.STICKERS);
			}
			dispatch(referencesActions.setIdReferenceMessageReaction(''));
		},
		[subPanelActive, setSubPanelActive]
	);

	const handleOpenEmoji = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			setShowCategories(true);
			setValueInputSearch('');
			dispatch(reactionActions.setReactionRightState(false));
			dispatch(reactionActions.setReactionBottomState(false));
			if (subPanelActive === SubPanelName.EMOJI) {
				setSubPanelActive(SubPanelName.NONE);
			} else {
				setSubPanelActive(SubPanelName.EMOJI);
			}
			dispatch(referencesActions.setIdReferenceMessageReaction(''));
		},
		[setSubPanelActive, subPanelActive]
	);

	return (
		<div className="flex flex-row absolute h-11 items-center gap-1 mr-3 top-0 right-0">
			<div {...voiceLongPress} className={`w-6 h-6 ${hasPermissionEdit ? '' : 'cursor-not-allowed'}`}>
				<Icons.MicEnable
					className={`w-6 h-6 ${isRecording ? 'text-red-600' : 'dark:text-[#AEAEAE] text-colorTextLightMode dark:hover:text-white hover:text-black'}`}
				/>
			</div>

			<div onClick={handleOpenGifs} className={`block max-sm:hidden w-6 h-6 ${hasPermissionEdit ? '' : 'cursor-not-allowed'}`}>
				<Icons.Gif defaultSize="w-6 h-6" isWhite={subPanelActive === SubPanelName.GIFS} />
			</div>

			<div onClick={handleOpenStickers} className={`block max-sm:hidden w-6 h-6 ${hasPermissionEdit ? '' : 'cursor-not-allowed'}`}>
				<Icons.Sticker defaultSize="w-6 h-6" isWhite={subPanelActive === SubPanelName.STICKERS} />
			</div>

			<div onClick={handleOpenEmoji} className={`w-6 h-6 ${hasPermissionEdit ? '' : 'cursor-not-allowed'}`}>
				<Icons.Smile defaultSize="w-6 h-6" defaultFill={`${subPanelActive === SubPanelName.EMOJI ? '#FFFFFF' : '#AEAEAE'}`} />
			</div>
		</div>
	);
});

export default GifStickerEmojiButtons;
