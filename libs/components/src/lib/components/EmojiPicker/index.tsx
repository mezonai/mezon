import { useAuth, useChatReaction, useEmojiSuggestionContext, useEscapeKeyClose, useGifsStickersEmoji, usePermissionChecker } from '@mezon/core';
import {
	emojiRecentActions,
	emojiSuggestionActions,
	referencesActions,
	selectAddEmojiState,
	selectCurrentChannelClanId,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentChannelPrivate,
	selectMessageByMessageId,
	selectModeResponsive,
	selectPendingUnlockMap,
	selectThreadCurrentChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IEmoji, RequestInput } from '@mezon/utils';
import {
	EEmojiCategory,
	EPermission,
	EmojiPlaces,
	FOR_SALE_CATE,
	ITEM_TYPE,
	MAX_LENGTH_MESSAGE_BUZZ,
	ModeResponsive,
	PREDEFINED_EMOJI_CATEGORIES,
	RECENT_EMOJI_CATEGORY,
	SubPanelName,
	getIdSaleItemFromSource,
	getSrcEmoji,
	isPublicChannel
} from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MentionItem } from 'react-mentions';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';
import ModalBuyItem from '../GifsStickersEmojis/ModalBuyItem';

export type EmojiCustomPanelOptions = {
	messageEmojiId?: string | undefined;
	isReaction?: boolean;
	onClickAddButton?: () => void;
	onClose: () => void;
	isFocusTopicBox?: boolean;
	isFocusThreadBox?: boolean;
	emojiAction?: EmojiPlaces;
	currenTopicId?: string;
	directId?: string;
	isClanView: boolean;
	buzzInputRequest?: RequestInput;
	setBuzzInputRequest?: (value: RequestInput) => void;
	toggleEmojiPanel?: () => void;
	isFromTopicView?: boolean;
	onEmojiSelect?: (emoji: string, emojiId: string) => void;
};

const searchEmojis = (emojis: IEmoji[], searchTerm: string) => {
	const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
	return emojis.filter((emoji) => emoji?.shortname?.toLowerCase().includes(lowerCaseSearchTerm) && emoji?.category !== RECENT_EMOJI_CATEGORY);
};

function EmojiCustomPanel(props: EmojiCustomPanelOptions) {
	const { t } = useTranslation('common');
	const { buzzInputRequest, setBuzzInputRequest, toggleEmojiPanel, isFocusThreadBox, isFocusTopicBox, messageEmojiId, currenTopicId } = props;
	const dispatch = useDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelClanId = useSelector(selectCurrentChannelClanId);
	const currentChannelPrivate = useSelector(selectCurrentChannelPrivate);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const addEmojiState = useSelector(selectAddEmojiState);

	const {
		categoryEmoji,
		categoriesEmoji,
		emojis,
		setAddEmojiActionChatbox,
		shiftPressedState: _shiftPressedState,
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
			<Icons.MarketIcons />,
			<Icons.Star defaultSize="h-7 w-7" />,
			<Icons.ClockIcon className="h-7 w-7" />,
			...categoryEmoji.map((emoji) =>
				emoji.clan_logo !== '' ? (
					<img src={emoji.clan_logo} className="max-w-7 max-h-7 w-full rounded-full aspect-square object-cover" alt={emoji.clan_name} />
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

	const categoriesWithIcons: { name: string; icon: JSX.Element }[] = useMemo(() => {
		const categories = categoriesEmoji.map((category, index) => ({
			name: category,
			icon: categoryIcons[index + 1]
		}));
		categories.splice(0, 0, {
			name: FOR_SALE_CATE,
			icon: categoryIcons[0]
		});

		return categories;
	}, [categoriesEmoji, categoryIcons]);

	const channelID = props.isClanView ? currentChannelId : props.directId;
	const currentThread = useAppSelector(selectThreadCurrentChannel);

	const messageEmoji = useAppSelector((state) =>
		selectMessageByMessageId(
			state,
			isFocusTopicBox ? currenTopicId : isFocusThreadBox ? currentThread?.channel_id : channelID,
			messageEmojiId || ''
		)
	);
	const { reactionMessageDispatch } = useChatReaction();
	const { setSubPanelActive, setPlaceHolderInput } = useGifsStickersEmoji();
	const [emojiId, setEmojiId] = useState<string>('');
	const [emojiHoverShortCode, setEmojiHoverShortCode] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const {
		emojiAction,
		messageEmojiId: propMessageEmojiId,
		isFocusTopicBox: propIsFocusTopicBox,
		isFromTopicView: propIsFromTopicView,
		onEmojiSelect: propOnEmojiSelect
	} = props;

	const handleEmojiSelect = useCallback(
		async (emojiId: string, emojiPicked: string) => {
			if (subPanelActive === SubPanelName.EMOJI_REACTION_RIGHT || subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM) {
				await reactionMessageDispatch({
					id: emojiId,
					messageId: propMessageEmojiId ?? '',
					emoji_id: emojiId.trim(),
					emoji: emojiPicked.trim(),
					count: 1,
					message_sender_id: messageEmoji?.sender_id ?? '',
					action_delete: false,
					is_public: isPublicChannel({ parent_id: currentChannelParentId, channel_private: currentChannelPrivate }),
					clanId: currentChannelClanId ?? '',
					channelId: propIsFromTopicView ? currentChannelId || '' : (messageEmoji?.channel_id ?? ''),
					isFocusTopicBox: propIsFocusTopicBox,
					channelIdOnMessage: messageEmoji?.channel_id
				});
				setSubPanelActive(SubPanelName.NONE);
				dispatch(referencesActions.setIdReferenceMessageReaction(''));
			} else if (subPanelActive === SubPanelName.EMOJI) {
				dispatch(emojiSuggestionActions.setSuggestionEmojiObjPicked({ shortName: '', id: '', isReset: true }));
				setAddEmojiActionChatbox(!addEmojiState);
				setSuggestionEmojiObjPicked(emojiId, emojiPicked, propIsFromTopicView);
			}
			if (emojiAction === EmojiPlaces.EMOJI_EDITOR_BUZZ) {
				const lastIndexOfInputPlainText = (buzzInputRequest?.content ?? '')?.length;
				if (lastIndexOfInputPlainText > MAX_LENGTH_MESSAGE_BUZZ) return;
				// const buzzInputRequestMentionArr = buzzInputRequest?.mentionRaw ?? [];
				const lastIndexOfInputValue = (buzzInputRequest?.valueTextInput ?? '')?.length;
				const _newEmoji: MentionItem = {
					childIndex: 0,
					display: emojiPicked,
					index: lastIndexOfInputValue > 0 ? lastIndexOfInputValue : 0,
					id: emojiId,
					plainTextIndex: lastIndexOfInputPlainText > 0 ? lastIndexOfInputPlainText : 0
				};
				if (setBuzzInputRequest) {
					setBuzzInputRequest({
						content: (buzzInputRequest?.content ?? '') + emojiPicked,
						// mentionRaw: [...buzzInputRequestMentionArr, newEmoji],
						valueTextInput: `${buzzInputRequest?.valueTextInput ?? ''}::[${emojiPicked}](${emojiId})`
					});
				}
				if (toggleEmojiPanel) {
					toggleEmojiPanel();
				}
			}
			if (propOnEmojiSelect) {
				propOnEmojiSelect(emojiId, emojiPicked);
			}
		},
		[
			subPanelActive,
			emojiAction,
			propMessageEmojiId,
			propIsFocusTopicBox,
			propIsFromTopicView,
			propOnEmojiSelect,
			reactionMessageDispatch,
			messageEmoji?.sender_id,
			messageEmoji?.channel_id,
			setSubPanelActive,
			dispatch,
			setAddEmojiActionChatbox,
			addEmojiState,
			setSuggestionEmojiObjPicked,
			buzzInputRequest?.content,
			buzzInputRequest?.valueTextInput,
			setBuzzInputRequest,
			toggleEmojiPanel,
			currentChannelClanId,
			currentChannelId,
			currentChannelParentId,
			currentChannelPrivate
		]
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

	useEffect(() => {
		const handleShiftKeyDown = (event: KeyboardEvent) => {
			if (event.shiftKey) {
				setShiftPressed(true);
			}
		};
		const handleShiftKeyUp = () => {
			setShiftPressed(false);
		};

		window.addEventListener('keydown', handleShiftKeyDown);
		window.addEventListener('keyup', handleShiftKeyUp);
		return () => {
			window.removeEventListener('keydown', handleShiftKeyDown);
			window.removeEventListener('keyup', handleShiftKeyUp);
		};
	}, [setShiftPressed]);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, props.onClose);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className={`outline-none flex max-h-full max-sm:h-32 max-sbm:h-full flex-row w-full md:w-[500px] max-sm:ml-1 pt-3`}
		>
			<div
				className={`w-11 max-sm:gap-x-1 flex flex-col max-sm:flex-row max-sm:justify-end gap-y-1 max-sm:w-full max-sbm:w-11 bg-item-theme pt-1 px-1 md:items-start h-[25rem] pb-1 max-sbm:flex-col overflow-y-scroll hide-scrollbar rounded-tl-lg rounded-tr-lg`}
			>
				{categoriesWithIcons.map((item, index) => {
					return (
						<button
							key={index}
							className={`w-9 h-9 py-2 max-sm:px-1 flex flex-row justify-center text-theme-primary  items-center ${selectedCategory === item.name ? 'bg-item-theme' : 'bg-item-hover'} rounded-md`}
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
				<div className="flex flex-col w-[90%]">
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
										categoryIcons={categoryIcons[index]}
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
	readonly onEmojiHover: (item: IEmoji) => void;
	readonly emojisData: IEmoji[];
	onClickAddButton?: () => void;
	showAddButton?: boolean;
	categoryIcons?: JSX.Element;
};

const getEmojisByCategories = (emojis: IEmoji[], categoryParam: string) => {
	if (categoryParam === FOR_SALE_CATE) {
		return emojis.filter((emoji) => emoji?.is_for_sale);
	}
	return emojis
		.filter((emoji) => !!emoji.id && emoji?.category?.includes(categoryParam) && !emoji?.is_for_sale)
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
	showAddButton,
	categoryIcons
}: DisplayByCategoriesProps) {
	const { t } = useTranslation('common');

	const shouldTranslate = categoryName && PREDEFINED_EMOJI_CATEGORIES.includes(categoryName);
	const emojisByCategoryName = useMemo(() => getEmojisByCategories(emojisData, categoryName ?? ''), [emojisData, categoryName]);

	const [emojisPanel, setEmojisPanelStatus] = useState<boolean>(categoryName === FOR_SALE_CATE ? false : true);
	return (
		<div>
			<button
				onClick={() => setEmojisPanelStatus(!emojisPanel)}
				className="w-full flex flex-row justify-start items-center pl-1 mb-1 mt-0 py-1 sticky z-10  bg-theme-setting-primary"
			>
				<div className="w-4 !h-4 flex items-center justify-center !text-xs">{categoryIcons}</div>
				<p className={'ml-2 uppercase text-left truncate text-xs font-semibold'}>
					{shouldTranslate ? t(`emojiCategories.${categoryName}`) || categoryName : categoryName}
				</p>
				<span className={`${emojisPanel ? ' rotate-90' : ''}`}>
					<Icons.ArrowRight defaultSize={`w-4 h-4`} />
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
	const { userProfile } = useAuth();
	const { valueInputToCheckHandleSearch } = useGifsStickersEmoji();
	const { shiftPressedState } = useEmojiSuggestionContext();
	const [hasClanPermission] = usePermissionChecker([EPermission.manageClan]);
	const isShowAddButton = useMemo(() => {
		return hasClanPermission && showAddButton && categoryName === EEmojiCategory.CUSTOM;
	}, [hasClanPermission, categoryName, showAddButton]);

	const [itemUnlock, setItemUnlock] = useState<IEmoji | null>(null);
	const dispatch = useAppDispatch();
	const handleConfirmBuyItem = async () => {
		if (itemUnlock) {
			await dispatch(
				emojiRecentActions.buyItemForSale({
					id: itemUnlock.id || '',
					type: ITEM_TYPE.EMOJI,
					creatorId: itemUnlock.creator_id,
					senderId: userProfile?.user?.id,
					username: userProfile?.user?.username
				})
			);
		}
	};
	const [openModalBuy, closeModalBuy] = useModal(() => {
		return <ModalBuyItem onCancel={closeModalBuy} onConfirm={handleConfirmBuyItem} />;
	}, [itemUnlock]);

	const handleOpenUnlockItem = useCallback(
		(item: IEmoji) => {
			setItemUnlock(item);
			openModalBuy();
		},
		[openModalBuy]
	);

	const onClickEmoji = useCallback(
		(item: IEmoji) => {
			const { is_for_sale, src, shortname, id } = item;
			if (!id || !shortname) return;

			if (is_for_sale) {
				return src ? onEmojiSelect(getIdSaleItemFromSource(src), shortname || '') : handleOpenUnlockItem(item);
			}

			onEmojiSelect(id, shortname);
		},
		[onEmojiSelect, handleOpenUnlockItem]
	);

	const pendingUnlockItemMap = useAppSelector(selectPendingUnlockMap);

	return (
		<div
			className={`  grid grid-cols-9 ml-1 gap-1   ${valueInputToCheckHandleSearch !== '' ? 'overflow-y-scroll overflow-x-hidden hide-scrollbar max-h-[352px]' : ''}`}
		>
			{emojisData.map((item, index) => {
				const isItemPendingUnlock = !!(item.id && pendingUnlockItemMap[item.id]);
				return (
					<button
						key={index}
						className={` relative ${shiftPressedState ? 'border-none outline-none' : ''} text-2xl  emoji-button  rounded-md bg-item-hover hover:rounded-md  p-1 flex items-center justify-center w-full aspect-square`}
						onClick={() => {
							if (!isItemPendingUnlock) onClickEmoji(item);
						}}
						onMouseEnter={() => {
							if (!isItemPendingUnlock) onEmojiHover(item);
						}}
						disabled={isItemPendingUnlock}
					>
						<img
							draggable="false"
							src={!item.src ? getSrcEmoji(item?.id || '') : item.src}
							alt={item.shortname}
							className={'max-h-full max-w-full'}
						/>
						{item.is_for_sale && !item.src && (
							<div className="absolute left-3 flex items-center justify-center aspect-square pointer-events-none">
								{isItemPendingUnlock ? (
									<Icons.LoadingSpinner className="w-4 h-4 text-white block group-hover:hidden" />
								) : (
									<Icons.LockIcon defaultSize="w-4 h-4 text-white block group-hover:hidden" defaultFill="white" />
								)}
							</div>
						)}
					</button>
				);
			})}
			{isShowAddButton && (
				<button
					className={`${shiftPressedState ? 'border-none outline-none' : ''} text-2xl  emoji-button  rounded-md  bg-item-hover hover:rounded-md  p-1 flex items-center justify-center w-full`}
					onMouseEnter={() =>
						onEmojiHover({
							id: '',
							shortname: 'Upload a custom emoji'
						})
					}
				>
					<div onClick={onClickAddButton}>
						<Icons.AddIcon />
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
	return (
		<div className={`w-full max-h-12 flex-1 bg-item-theme flex flex-row items-center pl-1 gap-x-1 justify-start py-1`}>
			{emojiId ? <img draggable="false" className="max-w-10 max-h-full" src={getSrcEmoji(emojiId)} /> : null}
			<span className="truncate max-w-[200px] overflow-hidden">{emojiHoverShortCode}</span>
		</div>
	);
});

export default React.memo(EmojiCustomPanel);
