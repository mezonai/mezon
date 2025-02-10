import { useGifsStickersEmoji } from '@mezon/core';
import { selectCurrentChannel, selectIdMessageRefReaction } from '@mezon/store';
import { EmojiPlaces, SubPanelName } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiChannelDescription } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import EmojiPickerComp from '../EmojiPicker';
import SoundSquare from './SoundSquare';
import StickerSquare from './StickerSquare';
import TenorGifCategories from './gifs/TenorGifCategories';
import { InputSearch } from './inputSearch';

export type GifStickerEmojiPopupOptions = {
	emojiAction?: EmojiPlaces;
	mode?: number;
	channelOrDirect?: ApiChannelDescription;
};

export const GifStickerEmojiPopup = ({ emojiAction, mode, channelOrDirect }: GifStickerEmojiPopupOptions) => {
	const { subPanelActive, setSubPanelActive, setValueInputSearch } = useGifsStickersEmoji();
	const idMessageRefReaction = useSelector(selectIdMessageRefReaction);
	const currentChannel = useSelector(selectCurrentChannel);
	const emojiRefParentDiv = useRef<HTMLDivElement>(null);

	const channelMode = useMemo(() => {
		if (!channelOrDirect?.type) return null;

		const modeMap: { [key in number]: ChannelStreamMode } = {
			[ChannelType.CHANNEL_TYPE_GROUP]: ChannelStreamMode.STREAM_MODE_GROUP,
			[ChannelType.CHANNEL_TYPE_DM]: ChannelStreamMode.STREAM_MODE_DM,
			[ChannelType.CHANNEL_TYPE_THREAD]: ChannelStreamMode.STREAM_MODE_THREAD,
			[ChannelType.CHANNEL_TYPE_CHANNEL]: ChannelStreamMode.STREAM_MODE_CHANNEL
		} as const;

		return modeMap[channelOrDirect.type];
	}, [channelOrDirect?.type]);

	const handleTabClick = useCallback(
		(tab: SubPanelName) => {
			setValueInputSearch('');
			setSubPanelActive(tab);
		},
		[setValueInputSearch, setSubPanelActive]
	);

	const closePannel = useCallback(() => {
		setSubPanelActive(SubPanelName.NONE);
	}, [setSubPanelActive]);

	const isShowEmojiPicker = useMemo(() => {
		const isMobile = window.innerWidth <= 640;
		const isStreaming = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;

		return (
			(subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && isMobile) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && isMobile) ||
			(emojiAction === EmojiPlaces.EMOJI_REACTION && !isMobile) ||
			(emojiAction === EmojiPlaces.EMOJI_REACTION_BOTTOM && !isMobile) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && isStreaming) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && isStreaming)
		);
	}, [subPanelActive, emojiAction, currentChannel?.type]);

	const containerClassName = useMemo(() => {
		const isStreaming = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
		const baseClasses = 'w-[370px] max-sm:w-full max-sm:pt-0 max-sm:rounded-none max-sm:mt-[-0.5rem]';
		const widthClasses = isStreaming ? 'sbm:w-[430px]' : 'sbm:w-[500px]';
		const heightClasses =
			emojiAction === EmojiPlaces.EMOJI_REACTION || emojiAction === EmojiPlaces.EMOJI_REACTION_BOTTOM
				? 'min-h-[400px]'
				: isShowEmojiPicker
					? 'min-h-[350px]'
					: 'min-h-[500px]';

		return `${baseClasses} ${widthClasses} max-sbm:w-[312px] max-sbm:rounded-lg h-fit rounded-lg dark:bg-bgSecondary bg-bgLightMode shadow shadow-neutral-900 z-30 ${heightClasses}`;
	}, [currentChannel?.type, emojiAction, isShowEmojiPicker]);

	const contentWidthClass = useMemo(() => {
		const isStreaming = currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING;
		return isStreaming ? 'md:w-[430px]' : 'md:w-[500px]';
	}, [currentChannel?.type]);

	return (
		<div onClick={(e) => e.stopPropagation()} className={containerClassName}>
			<div className="w-full">
				{!idMessageRefReaction && <TabBar subPanelActive={subPanelActive} onTabClick={handleTabClick} />}
				<InputSearch />
			</div>

			<div className={`w-full min-h-[400px] text-center ${contentWidthClass}`} ref={emojiRefParentDiv}>
				<ContentPanel
					subPanelActive={subPanelActive}
					channelOrDirect={channelOrDirect}
					mode={mode}
					channelMode={channelMode}
					contentWidthClass={contentWidthClass}
					onClose={closePannel}
					isShowEmojiPicker={isShowEmojiPicker}
					idMessageRefReaction={idMessageRefReaction}
				/>
			</div>
		</div>
	);
};

const TabBar = React.memo(({ subPanelActive, onTabClick }: { subPanelActive: SubPanelName; onTabClick: (tab: SubPanelName) => void }) => {
	const getTabClassName = useCallback((isActive: boolean) => {
		return `relative px-2 mx-2 rounded-md ${
			isActive
				? 'font-semibold dark:text-white text-black'
				: 'dark:text-gray-300 text-colorTextLightMode dark:hover:text-white hover:text-black'
		}`;
	}, []);

	return (
		<div className="flex justify-start flex-row mt-3 border-b border-blue-500 pb-1 pt-1 max-sm:justify-evenly">
			<button className={getTabClassName(subPanelActive === SubPanelName.GIFS)} onClick={() => onTabClick(SubPanelName.GIFS)}>
				Gifs
			</button>
			<button className={getTabClassName(subPanelActive === SubPanelName.STICKERS)} onClick={() => onTabClick(SubPanelName.STICKERS)}>
				Stickers
			</button>
			<button className={getTabClassName(subPanelActive === SubPanelName.EMOJI)} onClick={() => onTabClick(SubPanelName.EMOJI)}>
				Emojis
			</button>
			<button className={getTabClassName(subPanelActive === SubPanelName.SOUNDS)} onClick={() => onTabClick(SubPanelName.SOUNDS)}>
				Sounds
			</button>
		</div>
	);
});

const ContentPanel = React.memo(
	({
		subPanelActive,
		channelOrDirect,
		mode,
		channelMode,
		contentWidthClass,
		onClose,
		isShowEmojiPicker,
		idMessageRefReaction
	}: {
		subPanelActive: SubPanelName;
		channelOrDirect?: ApiChannelDescription;
		mode?: number;
		channelMode: number | null;
		contentWidthClass: string;
		onClose: () => void;
		isShowEmojiPicker: boolean;
		idMessageRefReaction?: string;
	}) => {
		if (subPanelActive === SubPanelName.GIFS) {
			return (
				<div className={`flex h-full pr-1 w-full ${contentWidthClass}`}>
					<TenorGifCategories
						activeTab={SubPanelName.EMOJI}
						channelOrDirect={channelOrDirect}
						mode={channelMode as number}
						onClose={onClose}
					/>
				</div>
			);
		}

		if (subPanelActive === SubPanelName.STICKERS) {
			return (
				<div className={`flex h-full pr-2 w-full ${contentWidthClass}`}>
					<StickerSquare channel={channelOrDirect} mode={channelMode as number} onClose={onClose} />
				</div>
			);
		}

		if (subPanelActive === SubPanelName.EMOJI || isShowEmojiPicker) {
			return (
				<div className={`flex h-full pr-2 w-full sbm:w-[312px] ${contentWidthClass}`}>
					<EmojiPickerComp mode={mode} messageEmojiId={idMessageRefReaction} onClose={onClose} />
				</div>
			);
		}
		if (subPanelActive === SubPanelName.SOUNDS) {
			return (
				<div className={`flex h-full pr-2 w-full sbm:w-[312px] ${contentWidthClass}`}>
					<SoundSquare channel={channelOrDirect} mode={channelMode as number} onClose={onClose} />
				</div>
			);
		}
		return null;
	}
);

export default React.memo(GifStickerEmojiPopup);
