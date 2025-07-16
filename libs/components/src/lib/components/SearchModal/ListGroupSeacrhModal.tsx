import { SearchItemProps, toggleDisableHover } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ListGroupSearchModalContext } from './ListGroupSearchModalContext';
import ListSearchModal from './ListSearchModal';

type Props = {
	listRecent: SearchItemProps[];
	listItemWithoutRecent: SearchItemProps[];
	normalizeSearchText: string;
	handleItemClick: (item: SearchItemProps) => void;
};

type ClassifiedLists = {
	mentionList: SearchItemProps[];
	unreadList: SearchItemProps[];
};
export const ListGroupSearchModal: React.FC<Props> = ({ listRecent, listItemWithoutRecent, normalizeSearchText, handleItemClick }) => {
	const classificationList = useMemo(
		() =>
			listItemWithoutRecent.reduce<ClassifiedLists>(
				(acc, item) => {
					const hasCountUnread = item.count_messsage_unread && item.count_messsage_unread > 0;
					const isTextChannel = item.type === ChannelType.CHANNEL_TYPE_CHANNEL;
					const isThreadChannel = item.type === ChannelType.CHANNEL_TYPE_THREAD;
					const isDMMessage = item.type === ChannelType.CHANNEL_TYPE_DM;
					const isGrMessage = item.type === ChannelType.CHANNEL_TYPE_GROUP;
					const hasUnread = item.lastSentTimeStamp > item.lastSeenTimeStamp;
					const hasUnreadChannel =
						(isTextChannel && !item.count_messsage_unread && hasUnread) || (isThreadChannel && !item.count_messsage_unread && hasUnread);
					const hasUnreadDmGr = (isDMMessage && hasUnread) || (isGrMessage && hasUnread);
					const isInListRecent = listRecent.some((recentItem) => recentItem.id === item.id);

					if ((hasCountUnread && isTextChannel) || (hasCountUnread && isThreadChannel)) {
						acc.mentionList.push(item);
					} else if (hasUnreadChannel || (hasUnreadDmGr && !isInListRecent)) {
						acc.unreadList.push(item);
					}
					return acc;
				},
				{ mentionList: [], unreadList: [] }
			),
		[listItemWithoutRecent]
	);

	const { mentionList, unreadList } = classificationList;

	const boxRef = useRef<HTMLDivElement | null>(null);
	const itemRefs = useRef<Record<string, Element | null>>({});
	const usingKeyboard = useRef<boolean>(true);
	const focusItemIndex = useRef<number>(0);
	const [focusItemId, setFocusItemId] = useState<string>('');

	const allItems = useMemo(() => {
		if (normalizeSearchText) {
			return listItemWithoutRecent;
		}
		return [...listRecent, ...mentionList, ...unreadList];
	}, [normalizeSearchText, listRecent, mentionList, unreadList, listItemWithoutRecent]);

	const isNoResult = useMemo(() => !allItems?.length, [allItems?.length]);

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
				className={`w-full max-h-[250px] overflow-x-hidden overflow-y-auto flex text-theme-primary flex-col gap-[3px] pr-[5px] thread-scroll`}
			>
				{!normalizeSearchText && listRecent.length > 0 && (
					<>
						<div className="text-xs font-semibold uppercase text-theme-primary py-2 text-theme-primary-active">Previous channels</div>
						<ListSearchModal
							listSearch={listRecent}
							focusItemId={focusItemId}
							searchText={normalizeSearchText}
							onMouseEnter={handleItemMouseEnter}
							onItemClick={handleItemClick}
						/>
					</>
				)}
				{!normalizeSearchText && mentionList.length > 0 && (
					<>
						<div className="text-xs font-semibold uppercase py-2 text-theme-primary-active">Mentions</div>
						<ListSearchModal
							listSearch={mentionList}
							onItemClick={handleItemClick}
							searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
							focusItemId={focusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)}
				{!normalizeSearchText && unreadList.length > 0 && (
					<>
						<div className="text-xs font-semibold uppercase py-2 text-theme-primary-active">Unread channels</div>
						<ListSearchModal
							listSearch={unreadList}
							onItemClick={handleItemClick}
							searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
							focusItemId={focusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)}
				{normalizeSearchText && listItemWithoutRecent.length > 0 && (
					<ListSearchModal
						listSearch={listItemWithoutRecent}
						onItemClick={handleItemClick}
						searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
						focusItemId={focusItemId}
						onMouseEnter={handleItemMouseEnter}
					/>
				)}

				{isNoResult && <span className=" flex flex-row justify-center">Can't seem to find what you're looking for?</span>}
			</div>
		</ListGroupSearchModalContext.Provider>
	);
};
