import { useVirtualizer } from '@mezon/components';
import { FriendsEntity, selectTheme } from '@mezon/store';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import FriendsListItem from './FriendsListItem';

type ListFriendsProps = {
	listFriendFilter: FriendsEntity[];
};

const FriendList = ({ listFriendFilter }: ListFriendsProps) => {
	const appearanceTheme = useSelector(selectTheme);
	const parentRef = useRef<HTMLDivElement>(null);
	const itemSize = 64;

	const virtualizer = useVirtualizer({
		count: listFriendFilter.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => itemSize,
		overscan: 5
	});

	const items = virtualizer.getVirtualItems();

	return (
		<div
			style={{
				height: `100%`,
				width: '100%',
				overflow: 'auto'
			}}
			ref={parentRef}
			className={`thread-scroll ${appearanceTheme === 'light' && `customScrollLightMode`}`}
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative'
				}}
			>
				{items.map((virtualRow) => (
					<div
						key={virtualRow.key}
						data-index={virtualRow.index}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: `${virtualRow.size}px`,
							transform: `translateY(${virtualRow.start}px)`
						}}
					>
						<div
							style={{
								height: 64
							}}
						>
							<FriendsListItem friend={listFriendFilter[virtualRow.index]} key={listFriendFilter[virtualRow.index].id} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default FriendList;
