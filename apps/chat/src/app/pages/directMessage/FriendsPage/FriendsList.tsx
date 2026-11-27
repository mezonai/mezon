import { useVirtualizer } from '@mezon/components';
import { selectTheme } from '@mezon/store';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import FriendsListItem from './FriendsListItem';
import type { FriendListRow } from './friendSorting';

type ListFriendsProps = {
	rows: FriendListRow[];
};

const HEADER_ROW_HEIGHT = 36;
const FRIEND_ROW_HEIGHT = 64;

const FriendList = ({ rows }: ListFriendsProps) => {
	const { t } = useTranslation('friendsPage');
	const appearanceTheme = useSelector(selectTheme);
	const parentRef = useRef<HTMLDivElement>(null);

	const getScrollElement = useCallback(() => parentRef.current, []);

	const estimateSize = useCallback((index: number) => (rows[index]?.type === 'header' ? HEADER_ROW_HEIGHT : FRIEND_ROW_HEIGHT), [rows]);

	const getItemKey = useCallback(
		(index: number) => {
			const row = rows[index];
			return row.type === 'header' ? `header-${row.key}` : row.friend.id;
		},
		[rows]
	);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement,
		estimateSize,
		getItemKey,
		overscan: 5
	});

	const items = virtualizer.getVirtualItems();

	return (
		<div ref={parentRef} className={`h-full w-full overflow-auto thread-scroll ${appearanceTheme === 'light' && `customScrollLightMode`}`}>
			<div
				className="w-full relative"
				style={{
					height: `${virtualizer.getTotalSize()}px`
				}}
			>
				{items.map((virtualRow) => {
					const row = rows[virtualRow.index];
					if (!row) {
						return null;
					}
					return (
						<div
							key={virtualRow.key}
							data-index={virtualRow.index}
							className="absolute top-0 left-0 w-full"
							style={{
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`
							}}
						>
							{row.type === 'header' ? (
								<div
									key={`header-${row.key}`}
									style={{ height: HEADER_ROW_HEIGHT }}
									className="flex items-end pb-1.5 px-[14px] text-[12px] font-bold uppercase tracking-wide text-theme-primary"
								>
									{row.key === 'recent' ? t('sections.recent') : t('sections.others')}
								</div>
							) : (
								<div style={{ height: FRIEND_ROW_HEIGHT }}>
									<FriendsListItem friend={row.friend} key={row.friend.id} />
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default FriendList;
