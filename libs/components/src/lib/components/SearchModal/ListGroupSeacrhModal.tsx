import type { SearchItemProps } from '@mezon/utils';
import { toggleDisableHover } from '@mezon/utils';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListGroupSearchModalContext } from './ListGroupSearchModalContext';
import ListSearchModal from './ListSearchModal';

type Props = {
	listRecent: SearchItemProps[];
	listItemWithoutRecent: SearchItemProps[];
	unreadList: SearchItemProps[];
	normalizeSearchText: string;
	handleItemClick: (item: SearchItemProps) => void;
};

// Memoized so the renders SearchModal does while it holds the previous results (typing,
// store updates before SearchCtrlK answers) skip the whole row list.
export const ListGroupSearchModal = memo(({ unreadList, listRecent, listItemWithoutRecent, normalizeSearchText, handleItemClick }: Props) => {
	const { t } = useTranslation('common');

	const boxRef = useRef<HTMLDivElement | null>(null);
	const itemRefs = useRef<Record<string, Element | null>>({});
	const usingKeyboard = useRef<boolean>(true);
	const [focusItemId, setFocusItemId] = useState<string>('');
	const [focusSearchText, setFocusSearchText] = useState<string>(normalizeSearchText);
	if (focusSearchText !== normalizeSearchText) {
		setFocusSearchText(normalizeSearchText);
		setFocusItemId('');
	}

	const allItems = useMemo(() => {
		if (normalizeSearchText) {
			return listItemWithoutRecent;
		}
		return [...listRecent, ...unreadList];
	}, [normalizeSearchText, listRecent, unreadList, listItemWithoutRecent]);

	const isNoResult = useMemo(() => !allItems?.length, [allItems?.length]);

	const indexMap = useMemo(() => {
		return allItems.reduce<Record<string, number>>((acc, item, index) => {
			if (item.id) {
				acc[item.id] = index;
			}
			return acc;
		}, {});
	}, [allItems]);

	// The highlight follows the item, not the row index: rows that arrive or reorder for
	// the same query leave it where the user put it. A new query starts on the first row.
	const activeFocusItemId = indexMap[focusItemId] !== undefined ? focusItemId : (allItems[0]?.id ?? '');
	const activeFocusIndex = indexMap[activeFocusItemId] ?? 0;

	const handleItemMouseEnter = useCallback((item: SearchItemProps) => {
		if (item?.id && !usingKeyboard.current) {
			setFocusItemId(item.id);
		}
	}, []);

	const travelItemByKeyBoard = useCallback(
		(event: KeyboardEvent) => {
			event.preventDefault();
			let newFocusIndex = 0;
			switch (event.code) {
				case 'Enter': {
					handleItemClick(allItems[activeFocusIndex]);
					return;
				}
				case 'ArrowDown': {
					newFocusIndex = activeFocusIndex + 1;
					break;
				}
				case 'ArrowUp': {
					newFocusIndex = activeFocusIndex - 1;
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
			setFocusItemId(focusId);
		},
		[allItems, activeFocusIndex, handleItemClick]
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

	useLayoutEffect(() => {
		boxRef.current?.scroll({ top: 0, behavior: 'instant' });
	}, [normalizeSearchText]);

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
							focusItemId={activeFocusItemId}
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
							focusItemId={activeFocusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)}
				{normalizeSearchText && listItemWithoutRecent.length > 0 && (
					<>
						<div className="text-xs font-semibold uppercase py-2 text-theme-primary-active">{t('searchModal.search')}</div>
						<ListSearchModal
							listSearch={listItemWithoutRecent}
							onItemClick={handleItemClick}
							searchText={normalizeSearchText.startsWith('#') ? normalizeSearchText.slice(1) : normalizeSearchText}
							focusItemId={activeFocusItemId}
							onMouseEnter={handleItemMouseEnter}
						/>
					</>
				)}

				{isNoResult && <span className=" flex flex-row justify-center">{t('searchModal.noResults')}</span>}
			</div>
		</ListGroupSearchModalContext.Provider>
	);
});
