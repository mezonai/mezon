import { useAuth, useChatSending, useCurrentInbox, useEscapeKeyClose, useGifsStickersEmoji } from '@mezon/core';
import {
	MediaType,
	emojiRecentActions,
	referencesActions,
	selectAllStickerSuggestion,
	selectCurrentClanName,
	selectDataReferences,
	selectPendingUnlockMap,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { FOR_SALE_CATE, ITEM_TYPE, PREDEFINED_EMOJI_CATEGORIES, SubPanelName, blankReferenceObj } from '@mezon/utils';
import type { ClanSticker } from 'mezon-js';
import type { ApiChannelDescription, ApiMessageRef } from 'mezon-js/api.gen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import ModalBuyItem from './ModalBuyItem';

type ChannelMessageBoxProps = {
	channel: ApiChannelDescription | undefined;
	mode: number;
	onClose: () => void;
	isTopic?: boolean;
};

interface ICategorizedStickerProps {
	stickerList: {
		id: string | undefined;
		url: string | undefined;
		type: string | undefined;
		clanName: string | undefined;
		clanId: string | undefined;
		forSale: boolean | undefined;
		shortname: string;
	}[];
	categoryName: string;
	logo?: string;
	onClickSticker: (stickerUrl: StickerPanel) => void;
	valueInputToCheckHandleSearch?: string;
	onOpenBuySticker: (sticker: StickerPanel) => void;
}

interface IStickerPanelProps {
	stickerList: StickerPanel[];
	onClickSticker: (stickerUrl: StickerPanel) => void;
	onOpenBuySticker: (sticker: StickerPanel) => void;
}

type StickerPanel = {
	type?: string;
	url?: string;
	id?: string;
	forSale?: boolean;
	clanName?: string;
	clanId?: string;
	creatorId?: string;
	shortname?: string;
};

const searchStickers = (stickers: ClanSticker[], searchTerm: string) => {
	if (!searchTerm) return stickers;
	const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
	return stickers.filter((item) => item?.shortname?.toLowerCase().includes(lowerCaseSearchTerm));
};

function StickerSquare({ channel, mode, onClose, isTopic = false }: ChannelMessageBoxProps) {
	const { userProfile } = useAuth();
	const allStickers = useAppSelector(selectAllStickerSuggestion);
	const clanStickers = useMemo(
		() => allStickers.filter((sticker) => (sticker as any).media_type === undefined || (sticker as any).media_type === MediaType.STICKER),
		[allStickers]
	);

	const { sendMessage } = useChatSending({
		channelOrDirect: channel,
		mode,
		fromTopic: isTopic
	});
	const { valueInputToCheckHandleSearch, subPanelActive } = useGifsStickersEmoji();
	const [searchedStickers, setSearchStickers] = useState<ClanSticker[]>([]);
	const currentId = useCurrentInbox()?.channel_id;
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentId ?? ''));
	const isReplyAction = dataReferences.message_ref_id && dataReferences.message_ref_id !== '';
	const dispatch = useAppDispatch();

	useEffect(() => {
		const result = searchStickers(clanStickers, valueInputToCheckHandleSearch ?? '');
		setSearchStickers(result);
	}, [valueInputToCheckHandleSearch, subPanelActive, clanStickers]);

	const categoryLogo = useMemo(() => {
		const categorizedStickers = clanStickers
			.filter((sticker) => !sticker.is_for_sale)
			.reduce((acc: { id?: string; type?: string; url?: string }[], sticker) => {
				if (!acc.some((item) => item.id === sticker.clan_id)) {
					acc.push({
						id: sticker.clan_id,
						type: sticker.clan_name,
						url: sticker.logo
					});
				}
				return acc;
			}, []);
		return [{ id: FOR_SALE_CATE, type: FOR_SALE_CATE, url: FOR_SALE_CATE }, ...categorizedStickers];
	}, [clanStickers]);
	const stickers = useMemo(() => {
		return [
			...searchedStickers.map((sticker) => ({
				id: sticker.id,
				url: sticker.source,
				type: sticker.clan_name,
				clanName: sticker.category,
				clanId: sticker.clan_id,
				forSale: sticker.is_for_sale,
				creatorId: sticker.creator_id,
				shortname: sticker.shortname || ''
			}))
		].filter(Boolean);
	}, [searchedStickers]);

	const { setSubPanelActive } = useGifsStickersEmoji();
	const [selectedType, setSelectedType] = useState('');
	const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const containerRef = useRef<HTMLDivElement>(null);

	const handleClickImage = (image: StickerPanel) => {
		const imageUrl = image.url ? image.url : `${process.env.NX_BASE_IMG_URL}/stickers/${image.id}.webp`;
		if (isReplyAction) {
			sendMessage({ t: '' }, [], [{ url: imageUrl, filetype: 'image/gif', filename: image.id }], [dataReferences], undefined);

			dispatch(
				referencesActions.setDataReferences({
					channelId: currentId as string,
					dataReferences: blankReferenceObj as ApiMessageRef
				})
			);
		} else {
			sendMessage({ t: '' }, [], [{ url: imageUrl, filetype: 'image/gif', filename: image.id }], [], undefined);
		}
		setSubPanelActive(SubPanelName.NONE);
	};
	const scrollToCategory = (event: React.MouseEvent, categoryName: string) => {
		event.stopPropagation();
		if (categoryName !== selectedType) {
			setSelectedType(categoryName);
			const categoryDiv = categoryRefs.current[categoryName];
			if (categoryDiv && containerRef.current) {
				const containerTop = containerRef.current.getBoundingClientRect().top;
				const categoryTop = categoryDiv.getBoundingClientRect().top;
				const offset = 0;
				const scrollTop = categoryTop - containerTop - offset;
				containerRef.current.scrollTop += scrollTop;
			}
		}
	};

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	const [stickerBuy, setStickerBuy] = useState<StickerPanel | null>(null);
	const handleOpenBuySticker = (sticker: StickerPanel) => {
		setStickerBuy(sticker);
		openModalListBuy();
	};
	const [openModalListBuy, closeModalListBuy] = useModal(() => {
		const handleConfirmBuyItem = async () => {
			if (stickerBuy) {
				await dispatch(
					emojiRecentActions.buyItemForSale({
						id: stickerBuy.id,
						type: ITEM_TYPE.STICKER,
						creatorId: stickerBuy.creatorId,
						senderId: userProfile?.user?.id,
						username: userProfile?.user?.username
					})
				);
			}
		};
		return <ModalBuyItem onConfirm={handleConfirmBuyItem} onCancel={closeModalListBuy} />;
	}, [stickerBuy, userProfile?.user?.id]);

	return (
		<div ref={modalRef} tabIndex={-1} className="outline-none flex h-full w-full md:w-[500px] max-sm:ml-1 pt-3">
			<div className="overflow-y-auto overflow-x-hidden hide-scrollbar h-[25rem] rounded md:ml-2 ">
				<div
					className="w-11 max-sm:gap-x-1
                flex flex-col max-sm:flex-row max-sm:justify-end max-sbm:justify-start gap-y-1
                max-sm:w-full max-sbm:w-11 bg-item-theme pt-1
                px-1 md:items-start pb-1  max-sbm:flex-col
                items-center min-h-[25rem] rounded-tl-lg rounded-tr-lg"
				>
					{categoryLogo.map((avt) => (
						<button
							key={avt.id}
							onClick={(e) => scrollToCategory(e, avt.type || '')}
							className="flex justify-center items-center max-sm:px-1 w-9 h-9 rounded-lg bg-item-hover"
						>
							{avt.type === FOR_SALE_CATE ? (
								<div
									onClick={(e) => scrollToCategory(e, FOR_SALE_CATE)}
									className="w-9 h-9 py-2  max-sm:hidden flex flex-row justify-center items-center hover:rounded-md"
								>
									<Icons.MarketIcons />
								</div>
							) : (
								<>
									{avt.url !== '' ? (
										<img
											src={avt.url}
											alt={`avt ${avt.id}`}
											className={`w-7 h-7 object-cover aspect-square cursor-pointer  bg-item-hover ${avt.type === selectedType ? 'bg-item-theme' : ''} hover:rounded-full justify-center items-center border-theme-primary rounded-full aspect-square`}
											role="button"
										/>
									) : (
										<div className="">{avt?.type?.charAt(0).toUpperCase()}</div>
									)}
								</>
							)}
						</button>
					))}
				</div>
			</div>
			<div className="flex flex-col h-[400px] overflow-y-auto flex-1 hide-scrollbar" ref={containerRef}>
				{valueInputToCheckHandleSearch ? (
					<StickerPanel stickerList={stickers} onClickSticker={handleClickImage} onOpenBuySticker={handleOpenBuySticker} />
				) : (
					<>
						{categoryLogo.map((avt) => (
							<div ref={(el) => (categoryRefs.current[avt.type || ''] = el)} key={avt.id}>
								<CategorizedStickers
									valueInputToCheckHandleSearch={valueInputToCheckHandleSearch}
									stickerList={stickers}
									onClickSticker={handleClickImage}
									categoryName={avt.type || ''}
									logo={avt.url}
									onOpenBuySticker={handleOpenBuySticker}
								/>
							</div>
						))}
					</>
				)}
			</div>
		</div>
	);
}
export default StickerSquare;

const CategorizedStickers: React.FC<ICategorizedStickerProps> = ({ stickerList, categoryName, onClickSticker, onOpenBuySticker, logo }) => {
	const { t } = useTranslation('common');
	const stickersListByCategoryName = stickerList.filter((sticker) =>
		categoryName === FOR_SALE_CATE ? sticker.forSale : sticker.type === categoryName && !sticker.forSale
	);
	const [isShowStickerList, setIsShowStickerList] = useState(categoryName === FOR_SALE_CATE ? false : true);
	const currentClanName = useAppSelector(selectCurrentClanName);

	const handleToggleButton = () => {
		setIsShowStickerList(!isShowStickerList);
	};

	const shouldTranslate = categoryName && PREDEFINED_EMOJI_CATEGORIES.includes(categoryName);
	const displayCategoryName = shouldTranslate ? t(`emojiCategories.${categoryName}`) || categoryName : categoryName;

	return (
		<div>
			<button
				onClick={handleToggleButton}
				className="w-full flex flex-row justify-start items-center pl-1 mb-1 mt-0 py-1 sticky top-[-0.5rem]  z-10  max-h-full bg-theme-setting-primary"
			>
				{logo === FOR_SALE_CATE ? (
					<Icons.MarketIcons className="w-4 h4" />
				) : logo !== '' ? (
					<img
						src={logo}
						alt={categoryName || 'category'}
						className="w-4 !h-4 flex items-center justify-center rounded-full object-cover"
					/>
				) : (
					<div className="dark:text-textDarkTheme text-xs text-textLightTheme w-4 h-4 rounded-full bg-theme-primary">
						{categoryName?.charAt(0).toUpperCase()}
					</div>
				)}

				<p className={'ml-2 uppercase text-left truncate text-xs font-semibold'}>
					{categoryName !== 'custom' ? displayCategoryName : currentClanName}
				</p>
				<span className={`${isShowStickerList ? ' rotate-90' : ''}`}>
					<Icons.ArrowRight defaultSize="w-4 h-4" />
				</span>
			</button>
			{isShowStickerList && (
				<StickerPanel stickerList={stickersListByCategoryName} onClickSticker={onClickSticker} onOpenBuySticker={onOpenBuySticker} />
			)}
		</div>
	);
};

const StickerPanel: React.FC<IStickerPanelProps> = ({ stickerList, onClickSticker, onOpenBuySticker }) => {
	const { setPlaceHolderInput } = useGifsStickersEmoji();
	const pendingUnlockItemMap = useAppSelector(selectPendingUnlockMap);

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{stickerList.length > 0 && (
				<div key={stickerList[0].id} className="w-auto pb-2 px-2">
					<div className="grid grid-cols-3 gap-4">
						{stickerList.map((sticker: StickerPanel) => {
							const isItemPendingUnlock = !!(sticker.id && pendingUnlockItemMap[sticker.id]);
							return (
								<div
									className="group relative w-full h-full border border-bgHoverMember aspect-square overflow-hidden flex items-center rounded-lg cursor-pointer"
									key={sticker.id}
									onMouseEnter={() => setPlaceHolderInput(sticker.shortname || '')}
								>
									<img
										src={sticker.url ? sticker.url : `${process.env.NX_BASE_IMG_URL}/stickers/${sticker.id}.webp`}
										alt="sticker"
										className={`w-full h-full aspect-square object-cover  hover:bg-bgLightModeButton ${sticker.id === '0' ? 'blur-sm' : ''}`}
										onClick={() => {
											if (!sticker.forSale || sticker.url) {
												onClickSticker(sticker);
											} else if (!isItemPendingUnlock) {
												onOpenBuySticker(sticker);
											}
										}}
										role="button"
									/>
									{sticker.forSale && (
										<>
											{!sticker.url && (
												<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center aspect-square pointer-events-none group">
													{isItemPendingUnlock ? (
														<Icons.LoadingSpinner className="w-8 h-8 text-white block group-hover:hidden" />
													) : (
														<>
															<Icons.LockIcon
																defaultSize="w-16 h-16 text-white block group-hover:hidden"
																defaultFill="white"
															/>
															<Icons.UnLockIcon
																defaultSize="w-16 h-16 text-white hidden group-hover:block"
																defaultFill="white"
															/>
														</>
													)}
												</div>
											)}

											<Icons.MarketIcons className="absolute top-1 right-1 w-4 h-4 text-yellow-300" />
										</>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
};
