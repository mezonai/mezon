import { useAppParams, useChatReaction, useEmojiSuggestionContext, useEscapeKeyClose, useGifsStickersEmoji, usePermissionChecker } from '@mezon/core';
import {
	emojiSuggestionActions,
	referencesActions,
	selectClanView,
	selectCurrentChannel,
	selectMessageByMessageId,
	selectModeResponsive,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EEmojiCategory, EPermission, IEmoji, ModeResponsive, SubPanelName, getSrcEmoji, isPublicChannel } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export type EmojiCustomPanelOptions = {
	messageEmojiId?: string | undefined;
	mode?: number;
	isReaction?: boolean;
	onClickAddButton?: () => void;
	onClose: () => void;
};

const searchEmojis = (emojis: IEmoji[], searchTerm: string) => {
	const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
	return emojis.filter((emoji) => emoji?.shortname?.toLowerCase().includes(lowerCaseSearchTerm));
};

function EmojiCustomPanel(props: EmojiCustomPanelOptions) {
	const dispatch = useDispatch();
	const currentChannel = useSelector(selectCurrentChannel);
	const {
		categoryEmoji,
		categoriesEmoji,
		emojis,
		setAddEmojiActionChatbox,
		addEmojiState,
		shiftPressedState,
		setSuggestionEmojiObjPicked,
		setShiftPressed
	} = useEmojiSuggestionContext();

	const containerRef = useRef<HTMLDivElement>(null);
	const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const { valueInputToCheckHandleSearch, subPanelActive } = useGifsStickersEmoji();
	const [emojisSearch, setEmojiSearch] = useState<IEmoji[]>();
	const modeResponsive = useAppSelector(selectModeResponsive);

	useEffect(() => {
		if (valueInputToCheckHandleSearch !== '') {
			const result = searchEmojis(emojis, valueInputToCheckHandleSearch ?? '');
			setEmojiSearch(result);
		}
	}, [valueInputToCheckHandleSearch, subPanelActive, emojis]);

	const categoryIcons = useMemo(
		() => [
			<Icons.ClockHistory defaultSize="w-7 h-7" />,
			...categoryEmoji.map((emoji) =>
				emoji.clan_logo !== '' ? (
					<img src={emoji.clan_logo} className="w-7 h-7 rounded-full" alt={emoji.clan_name} />
				) : (
					<div className="dark:text-textDarkTheme text-textLightTheme">{emoji.clan_name?.charAt(0).toUpperCase()}</div>
				)
			),
			<Icons.Smile defaultSize="w-7 h-7" />,
			<Icons.TheLeaf defaultSize="w-7 h-7" />,
			<Icons.Bowl defaultSize="w-7 h-7" />,
			<Icons.GameController defaultSize="w-7 h-7" />,
			<Icons.Bicycle defaultSize="w-7 h-7" />,
			<Icons.Object defaultSize="w-7 h-7" />,
			<Icons.Heart defaultSize="w-7 h-7" />,
			<Icons.Ribbon defaultSize="w-7 h-7" />
		],
		[categoryEmoji]
	);

	const categoriesWithIcons = useMemo(() => {
		return categoriesEmoji.map((category, index) => ({
			name: category,
			icon: categoryIcons[index]
		}));
	}, [categoriesEmoji, categoryIcons]);

	const { reactionMessageDispatch } = useChatReaction();
	const { setSubPanelActive, setPlaceHolderInput } = useGifsStickersEmoji();
	const [emojiId, setEmojiId] = useState<string>('');
	const [emojiHoverShortCode, setEmojiHoverShortCode] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const { directId } = useAppParams();

	const isClanView = useSelector(selectClanView);
	const channelID = isClanView ? currentChannel?.id : directId;
	const messageEmoji = useAppSelector((state) => selectMessageByMessageId(state, channelID, props.messageEmojiId || ''));

	const handleEmojiSelect = useCallback(
		async (emojiId: string, emojiPicked: string) => {
			if (subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT || subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM) {
				await reactionMessageDispatch(
					'',
					props.messageEmojiId ?? '',
					emojiId.trim(),
					emojiPicked.trim(),
					1,
					messageEmoji?.sender_id ?? '',
					false,
					isPublicChannel(currentChannel),
					messageEmoji.content?.tp ?? ''
				);
				setSubPanelActive(SubPanelName.NONE);
				dispatch(referencesActions.setIdReferenceMessageReaction(''));
			} else if (subPanelActive === SubPanelName.EMOJI) {
				dispatch(emojiSuggestionActions.setSuggestionEmojiObjPicked({ shortName: '', id: '', isReset: true }));
				setAddEmojiActionChatbox(!addEmojiState);
				setSuggestionEmojiObjPicked(emojiId, emojiPicked);
				if (!shiftPressedState) {
					setSubPanelActive(SubPanelName.NONE);
				}
			}
		},
		[subPanelActive, props.messageEmojiId, messageEmoji, currentChannel, dispatch, setSubPanelActive, addEmojiState, shiftPressedState]
	);

	const handleOnHover = useCallback((emojiHover: any) => {
		setEmojiId(emojiHover.id);
		setEmojiHoverShortCode(emojiHover.shortname);
		setPlaceHolderInput(emojiHover.shortname);
	}, []);

	const scrollToCategory = useCallback(
		(event: React.MouseEvent, categoryName: string) => {
			event.stopPropagation();
			if (categoryName !== selectedCategory) {
				setSelectedCategory(categoryName);
				const categoryDiv = categoryRefs.current[categoryName];
				if (categoryDiv && containerRef.current) {
					const containerTop = containerRef.current.getBoundingClientRect().top;
					const categoryTop = categoryDiv.getBoundingClientRect().top;
					const offset = 0;
					const scrollTop = categoryTop - containerTop - offset;
					containerRef.current.scrollTop += scrollTop;
				}
			}
		},
		[selectedCategory]
	);

	useEffect(() => {
		const handleScroll = () => {
			if (containerRef.current) {
				const containerRect = containerRef.current.getBoundingClientRect();
				const containerTop = containerRect.top;
				const containerBottom = containerRect.bottom;

				let closestCategory = '';
				let minDistance = Number.MAX_VALUE;

				Object.keys(categoryRefs.current).forEach((category) => {
					const ref = categoryRefs.current[category];
					if (ref) {
						const refRect = ref.getBoundingClientRect();
						const refTop = refRect.top;
						const refBottom = refRect.bottom;
						const distanceTop = Math.abs(refTop - containerTop);
						const distanceBottom = Math.abs(refBottom - containerBottom);
						const distance = Math.min(distanceTop, distanceBottom);

						if (distance < minDistance) {
							minDistance = distance;
							closestCategory = category;
						}
					}
				});
				setSelectedCategory(closestCategory);
			}
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener('scroll', handleScroll);
			return () => container.removeEventListener('scroll', handleScroll);
		}
	}, []);

	const handleShiftKeyDown = (event: KeyboardEvent) => {
		if (event.shiftKey) {
			setShiftPressed(true);
		}
	};
	const handleShiftKeyUp = () => {
		setShiftPressed(false);
	};

	useEffect(() => {
		window.addEventListener('keydown', handleShiftKeyDown);
		window.addEventListener('keyup', handleShiftKeyUp);
		return () => {
			window.removeEventListener('keydown', handleShiftKeyDown);
			window.removeEventListener('keyup', handleShiftKeyUp);
		};
	}, []);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, props.onClose);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className={`outline-none flex max-h-full max-sm:h-32 max-sbm:h-full flex-row w-full md:w-[500px] max-sm:ml-1 ${props.isReaction && 'border border-black rounded overflow-hidden'}`}
		>
			<div
				className={`w-11 max-sm:gap-x-1
				flex flex-col max-sm:flex-row max-sm:justify-end gap-y-1
				max-sm:w-full max-sbm:w-11 dark:bg-bgTertiary bg-bgLightModeSecond pt-1
				px-1 md:items-start h-[25rem] pb-1 rounded max-sbm:flex-col
				${!props.isReaction && 'md:ml-2 mb-2'}
        overflow-y-scroll
        hide-scrollbar`}
			>
				<div className="w-9 h-9 py-2 max-sm:hidden flex flex-row justify-center items-center dark:hover:bg-[#41434A] hover:bg-bgLightModeButton hover:rounded-md">
					<Icons.Star defaultSize="w-7 h-7" />
				</div>
				<hr className=" bg-gray-200 border w-full max-sm:h-full max-sm:w-[1px] max-sm:hidden" />
				{categoriesWithIcons.map((item, index) => {
					return (
						<button
							key={index}
							className={`w-9 h-9 py-2 max-sm:px-1 flex flex-row justify-center items-center ${selectedCategory === item.name ? 'bg-[#41434A]' : 'hover:bg-[#41434A]'} rounded-md`}
							onClick={(e) => scrollToCategory(e, item.name)}
						>
							{item.icon}
						</button>
					);
				})}
			</div>
			{valueInputToCheckHandleSearch !== '' && emojisSearch ? (
				<div className=" h-[400px]  w-[90%] pr-2">
					<div className="h-[352px]">
						{' '}
						<EmojisPanel emojisData={emojisSearch} onEmojiSelect={handleEmojiSelect} onEmojiHover={handleOnHover} />
					</div>
					<EmojiHover emojiHoverShortCode={emojiHoverShortCode} isReaction={props.isReaction} emojiId={emojiId} />
				</div>
			) : (
				<div className="flex flex-col w-[90%] pr-2">
					<div
						ref={containerRef}
						className="w-full  max-h-[352px] overflow-y-scroll pt-0 overflow-x-hidden hide-scrollbar dark: bg-transparent bg-bgLightMode"
					>
						{categoriesWithIcons.map((item, index) => {
							return (
								<div className="w-full" key={index} ref={(el) => (categoryRefs.current[item.name] = el)}>
									<DisplayByCategories
										emojisData={emojis}
										onEmojiSelect={handleEmojiSelect}
										onEmojiHover={handleOnHover}
										categoryName={item.name}
										onClickAddButton={props.onClickAddButton}
										showAddButton={modeResponsive === ModeResponsive.MODE_CLAN}
									/>
								</div>
							);
						})}
					</div>
					<EmojiHover emojiHoverShortCode={emojiHoverShortCode} isReaction={props.isReaction} emojiId={emojiId} />
				</div>
			)}
		</div>
	);
}

type DisplayByCategoriesProps = {
	readonly categoryName?: string;
	readonly onEmojiSelect: (emoji_id: string, emoji: string) => void;
	readonly onEmojiHover: (item: any) => void;
	readonly emojisData: any[];
	onClickAddButton?: () => void;
	showAddButton?: boolean;
};

const getEmojisByCategories = (emojis: IEmoji[], categoryParam: string) => {
	return emojis
		.filter((emoji) => !!emoji.id && emoji?.category?.includes(categoryParam))
		.map((emoji) => ({
			...emoji,
			category: emoji.category
		}));
};

const DisplayByCategories = React.memo(function DisplayByCategories({
	emojisData,
	categoryName,
	onEmojiSelect,
	onEmojiHover,
	onClickAddButton,
	showAddButton
}: DisplayByCategoriesProps) {
	const emojisByCategoryName = useMemo(() => getEmojisByCategories(emojisData, categoryName ?? ''), [emojisData, categoryName]);

	const [emojisPanel, setEmojisPanelStatus] = useState<boolean>(true);
	return (
		<div>
			<button
				onClick={() => setEmojisPanelStatus(!emojisPanel)}
				className="w-full flex flex-row justify-start items-center pl-1 mb-1 mt-0 py-1 sticky top-[-0.5rem] dark:bg-[#2B2D31] bg-bgLightModeSecond z-10 dark:text-white text-black"
			>
				<p className={'uppercase text-left truncate'}>{categoryName}</p>
				<span className={`${emojisPanel ? ' rotate-90' : ''}`}>
					{' '}
					<Icons.ArrowRight />
				</span>
			</button>
			{emojisPanel && (
				<EmojisPanel
					emojisData={emojisByCategoryName}
					onEmojiSelect={onEmojiSelect}
					onEmojiHover={onEmojiHover}
					categoryName={categoryName}
					onClickAddButton={onClickAddButton}
					showAddButton={showAddButton}
				/>
			)}
		</div>
	);
});

const EmojisPanel = React.memo(function EmojisPanel({
	emojisData,
	onEmojiSelect,
	onEmojiHover,
	categoryName,
	onClickAddButton,
	showAddButton
}: DisplayByCategoriesProps) {
	const { valueInputToCheckHandleSearch } = useGifsStickersEmoji();
	const { shiftPressedState } = useEmojiSuggestionContext();
	const appearanceTheme = useSelector(selectTheme);
	const [hasClanPermission] = usePermissionChecker([EPermission.manageClan]);
	const isShowAddButton = useMemo(() => {
		return hasClanPermission && showAddButton && categoryName === EEmojiCategory.CUSTOM;
	}, [hasClanPermission, categoryName, showAddButton]);

	return (
		<div
			className={`  grid grid-cols-9 ml-1 gap-1   ${valueInputToCheckHandleSearch !== '' ? 'overflow-y-scroll overflow-x-hidden hide-scrollbar max-h-[352px]' : ''}`}
		>
			{emojisData.map((item, index) => (
				<button
					key={index}
					className={`${shiftPressedState ? 'border-none outline-none' : ''} text-2xl  emoji-button  rounded-md  dark:hover:bg-[#41434A] hover:bg-bgLightModeButton hover:rounded-md  p-1 flex items-center justify-center w-full aspect-square`}
					onClick={() => {
						onEmojiSelect(item.id, item.shortname);
					}}
					onMouseEnter={() => onEmojiHover(item)}
				>
					<img draggable="false" src={getSrcEmoji(item?.id)} alt={item.shortname} className={'max-h-full max-w-full'} />
				</button>
			))}
			{isShowAddButton && (
				<button
					className={`${shiftPressedState ? 'border-none outline-none' : ''} text-2xl  emoji-button  rounded-md  dark:hover:bg-[#41434A] hover:bg-bgLightModeButton hover:rounded-md  p-1 flex items-center justify-center w-full`}
					onMouseEnter={() =>
						onEmojiHover({
							shortname: 'Upload a custom emoji',
							src: ''
						})
					}
				>
					<div onClick={onClickAddButton}>
						<Icons.AddIcon fill={appearanceTheme === 'dark' ? '#AEAEAE' : '#4D4F57'} />
					</div>
				</button>
			)}
		</div>
	);
});

type EmojiHoverProps = {
	emojiHoverShortCode: string;
	isReaction: boolean | undefined;
	emojiId: string;
};

const EmojiHover = React.memo(function EmojiHover({ emojiHoverShortCode, isReaction, emojiId }: EmojiHoverProps) {
	const appearanceTheme = useSelector(selectTheme);
	return (
		<div
			className={`w-full max-h-12 flex-1 dark:bg-[#232428] bg-bgLightModeSecond flex flex-row items-center pl-1 gap-x-1 justify-start dark:text-white text-black ${!isReaction && 'mb-2 max-sbm:mb-0'} py-1`}
		>
			{emojiId ? (
				<img draggable="false" className="max-w-10 max-h-full" src={getSrcEmoji(emojiId)} />
			) : (
				<Icons.AddIcon fill={appearanceTheme === 'dark' ? '#AEAEAE' : '#4D4F57'} />
			)}
			{emojiHoverShortCode}
		</div>
	);
});

export default React.memo(EmojiCustomPanel);
