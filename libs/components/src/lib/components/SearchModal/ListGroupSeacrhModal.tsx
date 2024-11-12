import { selectTheme } from '@mezon/store';
import { SearchItemProps, toggleDisableHover } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ListGroupSearchModalContext } from './ListGroupSearchModalContext';
import ListSearchModal from './ListSearchModal';

type Props = {
	listRecent: SearchItemProps[];
	listItemWithoutRecent: SearchItemProps[];
	normalizeSearchText: string;
	handleItemClick: (item: SearchItemProps) => void;
};

export const ListGroupSearchModal: React.FC<Props> = ({ listRecent, listItemWithoutRecent, normalizeSearchText, handleItemClick }) => {
	const appearanceTheme = useSelector(selectTheme);
	const boxRef = useRef<HTMLDivElement | null>(null);
	const itemRefs = useRef<Record<string, Element | null>>({});
	const usingKeyboard = useRef<boolean>(true);
	const focusItemIndex = useRef<number>(0);
	const [focusItemId, setFocusItemId] = useState<string>('');

	const allItems = useMemo(() => {
		if (normalizeSearchText) {
			return listItemWithoutRecent;
		}
		return [...listRecent, ...listItemWithoutRecent];
	}, [normalizeSearchText, listRecent, listItemWithoutRecent]);
	const isNoResult = useMemo(() => !allItems?.length, [allItems?.length]);
	// console.log('allItems: ', allItems);

	// // get data for unread part
	// const unreadChannelIds = useAppSelector((state) => selectUnreadChannelIds(state));
	// const getUnreadChannels = allItems.filter((item) => unreadChannelIds.includes(item.id ?? ''));
	// // get data for mentions part
	// const channelIdsHasUnreadCount = useAppSelector((state) => selectChannelIdsHasCountUnread(state));
	// const directIdsHasUnreadCount = useAppSelector((state) => selectListDMUnread(state));
	// const combineChannelsAndDirects = useMemo(() => {
	// 	return [...channelIdsHasUnreadCount, ...directIdsHasUnreadCount];
	// }, [channelIdsHasUnreadCount, directIdsHasUnreadCount]);

	// const getCountUnreadChannels = mergeUnreadCount(allItems, combineChannelsAndDirects);

	const indexMap = useMemo(() => {
		return allItems.reduce<Record<string, number>>((acc, item, index) => {
			if (item.id) {
				acc[item.id] = index;
			}
			return acc;
		}, {});
	}, [allItems]);

	const handleItemMouseEnter = useCallback(
		(item: SearchItemProps) => {
			if (item?.id && !usingKeyboard.current) {
				focusItemIndex.current = indexMap[item?.id] ?? 0;
				setFocusItemId(item?.id ?? '');
			}
		},
		[indexMap]
	);

	const travelItemByKeyBoard = useCallback(
		(event: KeyboardEvent) => {
			event.preventDefault();
			let newFocusIndex = 0;
			switch (event.code) {
				case 'Enter': {
					handleItemClick(allItems[focusItemIndex.current]);
					return;
				}
				case 'ArrowDown': {
					newFocusIndex = focusItemIndex.current + 1;
					break;
				}
				case 'ArrowUp': {
					newFocusIndex = focusItemIndex.current - 1;
					break;
				}
				default:
					return;
			}
			if (newFocusIndex < 0) {
				newFocusIndex = allItems.length - 1;
			} else if (newFocusIndex >= allItems.length) {
				newFocusIndex = 0;
			}
			const focusId = allItems[newFocusIndex]?.id ?? '';
			const element = itemRefs.current?.[focusId] as HTMLDivElement;
			if (newFocusIndex === 0) {
				boxRef.current?.scroll({ top: 0, behavior: 'smooth' });
			} else {
				element?.scrollIntoView({ behavior: 'smooth' });
			}
			focusItemIndex.current = newFocusIndex;
			setFocusItemId(focusId);
		},
		[allItems, handleItemClick]
	);

	const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			toggleDisableHover(boxRef.current, timeoutIdRef);
			travelItemByKeyBoard(event);
			usingKeyboard.current = true;
		};
		document.addEventListener('keyup', handler);
		return () => document.removeEventListener('keyup', handler);
	}, [travelItemByKeyBoard]);

	useEffect(() => {
		const handler = () => (usingKeyboard.current = false);
		document.addEventListener('mousemove', handler);
		return () => document.removeEventListener('mousemove', handler);
	});

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			focusItemIndex.current = 0;
			setFocusItemId(allItems?.[0]?.id ?? '');
			boxRef.current?.scroll({ top: 0, behavior: 'instant' });
		}, 300);
		return () => {
			timeoutId && clearTimeout(timeoutId);
		};
	}, [allItems, normalizeSearchText]);

	return (
		<ListGroupSearchModalContext.Provider value={{ itemRefs: itemRefs.current }}>
			<div
				ref={boxRef}
				className={`w-full max-h-[250px] overflow-x-hidden overflow-y-auto flex flex-col gap-[3px] pr-[5px]  ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}
			>
				{!normalizeSearchText && listRecent.length > 0 && (
					<>
						<div className="text-xs dark:text-white text-textLightTheme font-semibold uppercase py-2 ">Previous channels</div>
						<ListSearchModal
							listSearch={listRecent}
							focusItemId={focusItemId}
							searchText={normalizeSearchText}
							onMouseEnter={handleItemMouseEnter}
							onItemClick={handleItemClick}
						/>
					</>
				)}

				{/* {!normalizeSearchText && getCountUnreadChannels.length > 0 && (
					<>
						<div className="text-xs dark:text-white text-textLightTheme font-semibold uppercase py-2">Mentions</div>
						<ListSearchModal
							listSearch={getCountUnreadChannels as SearchItemProps[]}
							onItemClick={handleItemClick}
							searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
							focusItemId={focusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)}
				{!normalizeSearchText && getUnreadChannels.length > 0 && (
					<>
						<div className="text-xs dark:text-white text-textLightTheme font-semibold uppercase py-2">Unread channels</div>
						<ListSearchModal
							listSearch={getUnreadChannels}
							onItemClick={handleItemClick}
							searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
							focusItemId={focusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)} */}
				{normalizeSearchText && (
					<ListSearchModal
						listSearch={listItemWithoutRecent}
						onItemClick={handleItemClick}
						searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
						focusItemId={focusItemId}
						onMouseEnter={handleItemMouseEnter}
					/>
				)}

				{isNoResult && (
					<span className=" flex flex-row justify-center dark:text-white text-colorTextLightMode">
						Can't seem to find what you're looking for?
					</span>
				)}
			</div>
		</ListGroupSearchModalContext.Provider>
	);
};
