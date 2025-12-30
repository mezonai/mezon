import { useEmojiSuggestionContext, useEscapeKeyClose } from '@mezon/core';
import { Icons } from '@mezon/ui';
import type { IEmoji } from '@mezon/utils';
import { PREDEFINED_EMOJI_CATEGORIES, RECENT_EMOJI_CATEGORY, getSrcEmoji } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type EmojiRolePanelProps = {
	onEmojiSelect: (emojiId: string, emojiShortname: string) => void;
	onClose: () => void;
};

const searchEmojis = (emojis: IEmoji[], searchTerm: string) => {
	const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
	return emojis.filter((emoji) => emoji?.shortname?.toLowerCase().includes(lowerCaseSearchTerm) && emoji?.category !== RECENT_EMOJI_CATEGORY);
};

export const EmojiRolePanel: React.FC<EmojiRolePanelProps> = ({ onEmojiSelect, onClose }) => {
	const { t } = useTranslation('common');
	const { categoryEmoji, categoriesEmoji, emojis } = useEmojiSuggestionContext();

	const containerRef = useRef<HTMLDivElement>(null);
	const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const [emojisSearch, setEmojiSearch] = useState<IEmoji[]>();
	const [emojiId, setEmojiId] = useState<string>('');
	const [emojiHoverShortCode, setEmojiHoverShortCode] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [searchValue, setSearchValue] = useState<string>('');

	useEffect(() => {
		if (searchValue !== '') {
			const result = searchEmojis(emojis, searchValue);
			setEmojiSearch(result);
		} else {
			setEmojiSearch(undefined);
		}
	}, [searchValue, emojis]);

	const categoryIcons = useMemo(
		() => [
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
		return categoriesEmoji.map((category, index) => ({
			name: category,
			icon: categoryIcons[index]
		}));
	}, [categoriesEmoji, categoryIcons]);

	const handleEmojiSelect = useCallback(
		(emojiId: string, emojiShortname: string) => {
			onEmojiSelect(emojiId, emojiShortname);
		},
		[onEmojiSelect]
	);

	const handleOnHover = useCallback((emoji: IEmoji) => {
		setEmojiId(emoji.id || '');
		setEmojiHoverShortCode(emoji.shortname || '');
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

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	return (
		<div ref={modalRef} tabIndex={-1} className="outline-none flex flex-col max-h-full w-full pt-3 gap-2">
			<div className="w-full px-2">
				<input
					type="text"
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					placeholder={t('search') || 'Search emojis...'}
					className="w-full px-3 py-2 bg-item-theme text-theme-primary rounded-md border border-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="flex flex-row w-full">
				<div className="w-11 flex flex-col gap-y-1 bg-item-theme pt-1 px-1 h-[25rem] pb-1 overflow-y-scroll hide-scrollbar rounded-tl-lg rounded-tr-lg">
					{categoriesWithIcons.map((item, index) => {
						return (
							<button
								key={index}
								className={`w-9 h-9 py-2 flex flex-row justify-center text-theme-primary items-center ${selectedCategory === item.name ? 'bg-item-theme' : 'bg-item-hover'} rounded-md`}
								onClick={(e) => scrollToCategory(e, item.name)}
							>
								{item.icon}
							</button>
						);
					})}
				</div>
				{searchValue !== '' && emojisSearch ? (
					<div className="h-[400px] w-[90%] pr-2">
						<div className="h-[352px] overflow-y-scroll hide-scrollbar">
							<EmojisGrid emojisData={emojisSearch} onEmojiSelect={handleEmojiSelect} onEmojiHover={handleOnHover} />
						</div>
						<EmojiHover emojiHoverShortCode={emojiHoverShortCode} emojiId={emojiId} />
					</div>
				) : (
					<div className="flex flex-col w-[90%]">
						<div
							ref={containerRef}
							className="w-full max-h-[352px] overflow-y-scroll pt-0 overflow-x-hidden hide-scrollbar bg-transparent"
						>
							{categoriesWithIcons.map((item, index) => {
								return (
									<div className="w-full" key={index} ref={(el) => (categoryRefs.current[item.name] = el)}>
										<DisplayByCategories
											emojisData={emojis}
											onEmojiSelect={handleEmojiSelect}
											onEmojiHover={handleOnHover}
											categoryName={item.name}
											categoryIcons={categoryIcons[index]}
										/>
									</div>
								);
							})}
						</div>
						<EmojiHover emojiHoverShortCode={emojiHoverShortCode} emojiId={emojiId} />
					</div>
				)}
			</div>
		</div>
	);
};

type DisplayByCategoriesProps = {
	readonly categoryName?: string;
	readonly onEmojiSelect: (emojiId: string, emoji: string) => void;
	readonly onEmojiHover: (item: IEmoji) => void;
	readonly emojisData: IEmoji[];
	categoryIcons?: JSX.Element;
};

const getEmojisByCategories = (emojis: IEmoji[], categoryParam: string) => {
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
	categoryIcons
}: DisplayByCategoriesProps) {
	const { t } = useTranslation('common');

	const shouldTranslate = categoryName && PREDEFINED_EMOJI_CATEGORIES.includes(categoryName);
	const emojisByCategoryName = useMemo(() => getEmojisByCategories(emojisData, categoryName ?? ''), [emojisData, categoryName]);

	const [emojisPanel, setEmojisPanelStatus] = useState<boolean>(true);

	return (
		<div>
			<button
				onClick={() => setEmojisPanelStatus(!emojisPanel)}
				className="w-full flex flex-row justify-start items-center pl-1 mb-1 mt-0 py-1 sticky z-10 bg-theme-setting-primary text-theme-primary"
			>
				<div className="w-4 !h-4 flex items-center justify-center !text-xs">{categoryIcons}</div>
				<p className="ml-2 uppercase text-left truncate text-xs font-semibold">
					{shouldTranslate ? t(`emojiCategories.${categoryName}`) || categoryName : categoryName}
				</p>
				<span className={`${emojisPanel ? ' rotate-90' : ''}`}>
					<Icons.ArrowRight defaultSize="w-4 h-4" />
				</span>
			</button>
			{emojisPanel && <EmojisGrid emojisData={emojisByCategoryName} onEmojiSelect={onEmojiSelect} onEmojiHover={onEmojiHover} />}
		</div>
	);
});

const EmojisGrid = React.memo(function EmojisGrid({ emojisData, onEmojiSelect, onEmojiHover }: DisplayByCategoriesProps) {
	const onClickEmoji = useCallback(
		(item: IEmoji) => {
			const { shortname, id } = item;
			if (!id || !shortname) return;
			onEmojiSelect(id, shortname);
		},
		[onEmojiSelect]
	);

	return (
		<div className="grid grid-cols-9 ml-1 gap-1">
			{emojisData.map((item, index) => {
				return (
					<button
						key={index}
						className="relative text-2xl emoji-button rounded-md bg-item-hover hover:rounded-md p-1 flex items-center justify-center w-full aspect-square"
						onClick={() => onClickEmoji(item)}
						onMouseEnter={() => onEmojiHover(item)}
					>
						<img draggable="false" src={getSrcEmoji(item?.id || '')} alt={item.shortname} className="max-h-full max-w-full" />
					</button>
				);
			})}
		</div>
	);
});

type EmojiHoverProps = {
	emojiHoverShortCode: string;
	emojiId: string;
};

const EmojiHover = React.memo(function EmojiHover({ emojiHoverShortCode, emojiId }: EmojiHoverProps) {
	return (
		<div className="w-full max-h-12 flex-1 bg-item-theme flex flex-row items-center pl-1 gap-x-1 justify-start py-1 text-theme-primary">
			{emojiId ? <img draggable="false" className="max-w-10 max-h-full" src={getSrcEmoji(emojiId)} alt={emojiHoverShortCode} /> : null}
			<span className="truncate max-w-[200px] overflow-hidden">{emojiHoverShortCode}</span>
		</div>
	);
});
