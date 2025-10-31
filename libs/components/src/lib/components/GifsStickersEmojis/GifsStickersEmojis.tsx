import { useAppParams, useGifsStickersEmoji } from '@mezon/core';
import {
	selectClanView,
	selectClickedOnThreadBoxStatus,
	selectClickedOnTopicStatus,
	selectCurrentChannelType,
	selectCurrentTopicId,
	selectIdMessageRefReaction
} from '@mezon/store';
import type { RequestInput } from '@mezon/utils';
import { EmojiPlaces, SubPanelName } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
	buzzInputRequest?: RequestInput;
	setBuzzInputRequest?: (value: RequestInput) => void;
	toggleEmojiPanel?: () => void;
	isTopic?: boolean;
	onEmojiSelect?: (emoji: string, emojiId: string) => void;
	showTabs?: {
		gifs?: boolean;
		stickers?: boolean;
		emojis?: boolean;
		sounds?: boolean;
	};
};

export const GifStickerEmojiPopup = ({
	emojiAction,
	mode,
	channelOrDirect,
	buzzInputRequest,
	setBuzzInputRequest,
	toggleEmojiPanel,
	isTopic = false,
	onEmojiSelect,
	showTabs = { gifs: true, stickers: true, emojis: true, sounds: true }
}: GifStickerEmojiPopupOptions) => {
	const { subPanelActive, setSubPanelActive, setValueInputSearch } = useGifsStickersEmoji();
	const idMessageRefReaction = useSelector(selectIdMessageRefReaction);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const emojiRefParentDiv = useRef<HTMLDivElement>(null);

	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const fromTopic = isTopic || isFocusTopicBox;

	const channelMode = useMemo(() => {
		if (!channelOrDirect?.type) return null;

		const modeMap: { [key in number]: ChannelStreamMode } = {
			[ChannelType.CHANNEL_TYPE_GROUP]: ChannelStreamMode.STREAM_MODE_GROUP,
			[ChannelType.CHANNEL_TYPE_DM]: ChannelStreamMode.STREAM_MODE_DM,
			[ChannelType.CHANNEL_TYPE_THREAD]: ChannelStreamMode.STREAM_MODE_THREAD,
			[ChannelType.CHANNEL_TYPE_CHANNEL]: ChannelStreamMode.STREAM_MODE_CHANNEL,
			[ChannelType.CHANNEL_TYPE_APP]: ChannelStreamMode.STREAM_MODE_CHANNEL
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
		const isStreaming = currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING;

		return (
			(subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && isMobile) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && isMobile) ||
			(emojiAction === EmojiPlaces.EMOJI_REACTION && !isMobile) ||
			(emojiAction === EmojiPlaces.EMOJI_REACTION_BOTTOM && !isMobile) ||
			(emojiAction === EmojiPlaces.EMOJI_EDITOR_BUZZ && !isMobile) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT && isStreaming) ||
			(subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM && isStreaming)
		);
	}, [subPanelActive, emojiAction]);

	const containerClassName = useMemo(() => {
		const isStreaming = currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING;
		const baseClasses = 'w-[370px] max-sm:w-full max-sm:pt-0 max-sm:rounded-none max-sm:mt-[-0.5rem]';
		const widthClasses = isStreaming ? 'sbm:w-[430px]' : 'sbm:w-[500px]';
		const heightClasses =
			emojiAction === EmojiPlaces.EMOJI_REACTION || emojiAction === EmojiPlaces.EMOJI_REACTION_BOTTOM
				? 'min-h-[400px]'
				: isShowEmojiPicker
					? 'min-h-[350px]'
					: 'min-h-[500px]';

		return `${baseClasses} ${widthClasses} max-sbm:w-[calc(100dvw_-_24px)] max-sbm:rounded-lg h-fit rounded-lg text-theme-primary bg-theme-setting-primary shadow shadow-neutral-900 z-30 ${heightClasses}`;
	}, [emojiAction, isShowEmojiPicker]);

	const contentWidthClass = useMemo(() => {
		const isStreaming = currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING;
		return isStreaming ? 'md:w-[430px]' : 'md:w-[500px]';
	}, []);

	return (
		<div onClick={(e) => e.stopPropagation()} className={containerClassName}>
			<div className="w-full flex flex-col border-b-theme-primary pb-4">
				{!idMessageRefReaction && emojiAction !== EmojiPlaces.EMOJI_EDITOR_BUZZ && (
					<TabBar subPanelActive={subPanelActive} onTabClick={handleTabClick} showTabs={showTabs} />
				)}
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
					emojiAction={emojiAction}
					buzzInputRequest={buzzInputRequest}
					setBuzzInputRequest={setBuzzInputRequest}
					toggleEmojiPanel={toggleEmojiPanel}
					isTopic={fromTopic}
					onEmojiSelect={onEmojiSelect}
				/>
			</div>
		</div>
	);
};

const TabBar = React.memo(
	({
		subPanelActive,
		onTabClick,
		showTabs = { gifs: true, stickers: true, emojis: true, sounds: true }
	}: {
		subPanelActive: SubPanelName;
		onTabClick: (tab: SubPanelName) => void;
		showTabs?: {
			gifs?: boolean;
			stickers?: boolean;
			emojis?: boolean;
			sounds?: boolean;
		};
	}) => {
		const { t } = useTranslation('common');
		const getTabClassName = useCallback((isActive: boolean) => {
			return `relative px-2 mx-2 text-sm rounded-md ${isActive ? 'text-theme-primary-active font-semibold' : 'text-theme-primary'}`;
		}, []);

		return (
			<div className="flex justify-start flex-row mt-3 pt-1 max-sm:justify-evenly">
				{showTabs.gifs && (
					<button className={getTabClassName(subPanelActive === SubPanelName.GIFS)} onClick={() => onTabClick(SubPanelName.GIFS)}>
						{t('gifs')}
					</button>
				)}
				{showTabs.stickers && (
					<button className={getTabClassName(subPanelActive === SubPanelName.STICKERS)} onClick={() => onTabClick(SubPanelName.STICKERS)}>
						{t('stickers')}
					</button>
				)}
				{showTabs.emojis && (
					<button className={getTabClassName(subPanelActive === SubPanelName.EMOJI)} onClick={() => onTabClick(SubPanelName.EMOJI)}>
						{t('emojis')}
					</button>
				)}
				{showTabs.sounds && (
					<button className={getTabClassName(subPanelActive === SubPanelName.SOUNDS)} onClick={() => onTabClick(SubPanelName.SOUNDS)}>
						{t('sounds')}
					</button>
				)}
			</div>
		);
	}
);

const ContentPanel = React.memo(
	({
		subPanelActive,
		channelOrDirect,
		mode,
		channelMode,
		contentWidthClass,
		onClose,
		isShowEmojiPicker,
		idMessageRefReaction,
		emojiAction,
		buzzInputRequest,
		setBuzzInputRequest,
		toggleEmojiPanel,
		isTopic,
		onEmojiSelect
	}: {
		subPanelActive: SubPanelName;
		channelOrDirect?: ApiChannelDescription;
		mode?: number;
		channelMode: number | null;
		contentWidthClass: string;
		onClose: () => void;
		isShowEmojiPicker: boolean;
		idMessageRefReaction?: string;
		emojiAction?: EmojiPlaces;
		buzzInputRequest?: RequestInput;
		setBuzzInputRequest?: (value: RequestInput) => void;
		toggleEmojiPanel?: () => void;
		isTopic: boolean;
		onEmojiSelect?: (emojiId: string, emoji: string) => void;
	}) => {
		const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
		const isFocusThreadBox = useSelector(selectClickedOnThreadBoxStatus);

		const currenTopicId = useSelector(selectCurrentTopicId);
		const { directId } = useAppParams();
		const isClanView = useSelector(selectClanView);
		if (subPanelActive === SubPanelName.GIFS) {
			return (
				<div className={`flex h-full pr-1 w-full ${contentWidthClass}`}>
					<TenorGifCategories
						activeTab={SubPanelName.EMOJI}
						channelOrDirect={channelOrDirect}
						mode={channelMode as number}
						onClose={onClose}
						isTopic={isTopic}
					/>
				</div>
			);
		}

		if (subPanelActive === SubPanelName.STICKERS) {
			return (
				<div className={`flex h-full pr-2 w-full ${contentWidthClass}`}>
					<StickerSquare channel={channelOrDirect} mode={channelMode as number} onClose={onClose} isTopic={isTopic} />
				</div>
			);
		}

		if (subPanelActive === SubPanelName.EMOJI || isShowEmojiPicker) {
			return (
				<div className={`flex h-full pr-2 w-full sbm:w-[312px] ${contentWidthClass}`}>
					<EmojiPickerComp
						isFocusTopicBox={isFocusTopicBox}
						currenTopicId={currenTopicId ?? ''}
						directId={directId}
						isClanView={isClanView}
						messageEmojiId={idMessageRefReaction}
						onClose={onClose}
						isFocusThreadBox={isFocusThreadBox}
						emojiAction={emojiAction}
						buzzInputRequest={buzzInputRequest}
						setBuzzInputRequest={setBuzzInputRequest}
						toggleEmojiPanel={toggleEmojiPanel}
						isFromTopicView={!!isTopic}
						onEmojiSelect={onEmojiSelect}
					/>
				</div>
			);
		}
		if (subPanelActive === SubPanelName.SOUNDS) {
			return (
				<div className={`flex h-full pr-2 w-full ${contentWidthClass}`}>
					<SoundSquare channel={channelOrDirect} mode={channelMode as number} onClose={onClose} isTopic={isTopic} />
				</div>
			);
		}
		return null;
	}
);

export default React.memo(GifStickerEmojiPopup);
