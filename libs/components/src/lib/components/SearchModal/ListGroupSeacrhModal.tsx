import type { SearchItemProps } from '@mezon/utils';
import { toggleDisableHover } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListGroupSearchModalContext } from './ListGroupSearchModalContext';
import ListSearchModal from './ListSearchModal';

type Props = {
	listRecent: SearchItemProps[];
	listItemWithoutRecent: SearchItemProps[];
	unreadList: SearchItemProps[];
	normalizeSearchText: string;
	handleItemClick: (item: SearchItemProps) => void;
	isAwaitingResults: boolean;
};

export const ListGroupSearchModal: React.FC<Props> = ({
	unreadList,
	listRecent,
	listItemWithoutRecent,
	normalizeSearchText,
	handleItemClick,
	isAwaitingResults
}) => {
	const { t } = useTranslation('common');

	const boxRef = useRef<HTMLDivElement | null>(null);
	const itemRefs = useRef<Record<string, Element | null>>({});
	const usingKeyboard = useRef<boolean>(true);
	const focusItemIndex = useRef<number>(0);
	const [focusItemId, setFocusItemId] = useState<string>('');

	const allItems = useMemo(() => {
		if (normalizeSearchText) {
			return isAwaitingResults ? [] : listItemWithoutRecent;
		}
		return [...listRecent, ...unreadList];
	}, [normalizeSearchText, isAwaitingResults, listRecent, unreadList, listItemWithoutRecent]);

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
	}, []);

	const lastResultsKey = useRef<string>('');

	useEffect(() => {
		const resultsKey = `${normalizeSearchText}\u0000${allItems.map((item) => item.id ?? '').join('|')}`;
		if (resultsKey === lastResultsKey.current) {
			return;
		}
		lastResultsKey.current = resultsKey;

		focusItemIndex.current = 0;
		setFocusItemId(allItems?.[0]?.id ?? '');
		boxRef.current?.scroll({ top: 0, behavior: 'instant' });
	}, [allItems, normalizeSearchText]);

	const listGroupSearchContextValue = useMemo(() => ({ itemRefs: itemRefs.current }), []);

	return (
		<ListGroupSearchModalContext.Provider value={listGroupSearchContextValue}>
			<div
				ref={boxRef}
				className={`w-full max-h-[250px] overflow-x-hidden overflow-y-auto flex text-theme-primary flex-col gap-[3px] pr-[5px] thread-scroll`}
			>
				{!normalizeSearchText && listRecent.length > 0 && (
					<>
						<div className="text-xs font-semibold uppercase text-theme-primary py-2 text-theme-primary-active">
							{t('searchModal.previousChannels')}
						</div>
						<ListSearchModal
							listSearch={listRecent}
							focusItemId={focusItemId}
							searchText={normalizeSearchText}
							onMouseEnter={handleItemMouseEnter}
							onItemClick={handleItemClick}
						/>
					</>
				)}
				{!normalizeSearchText && unreadList.length > 0 && (
					<>
						<div className="text-xs font-semibold uppercase py-2 text-theme-primary-active">{t('searchModal.unreadChannels')}</div>
						<ListSearchModal
							listSearch={unreadList}
							onItemClick={handleItemClick}
							searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
							focusItemId={focusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)}
				{normalizeSearchText && !isAwaitingResults && listItemWithoutRecent.length > 0 && (
					<ListSearchModal
						listSearch={listItemWithoutRecent}
						onItemClick={handleItemClick}
						searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
						focusItemId={focusItemId}
						onMouseEnter={handleItemMouseEnter}
					/>
				)}

				{(isAwaitingResults || isNoResult) && (
					<span className="flex flex-1 flex-row items-center justify-center">
						{isAwaitingResults ? t('loadingData') : t('searchModal.noResults')}
					</span>
				)}
			</div>
		</ListGroupSearchModalContext.Provider>
	);
};
