import { useAppParams, useMenu } from '@mezon/core';
import { channelsActions, selectCloseMenu, selectStatusStream, selectTheme, useAppDispatch } from '@mezon/store';
import { isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DMListItem from './DMListItem';

type ListDMChannelProps = {
	listDM: string[];
};

const heightAroundComponent = 230;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;
const ListDMChannel = ({ listDM }: ListDMChannelProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { directId: currentDmGroupId } = useAppParams();
	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const appearanceTheme = useSelector(selectTheme);
	const streamPlay = useSelector(selectStatusStream);

	const [height, setHeight] = useState(window.innerHeight - heightAroundComponent - (streamPlay ? 56 : 0) - titleBarHeight);

	useEffect(() => {
		const updateHeight = () => setHeight(window.innerHeight - heightAroundComponent - (streamPlay ? 56 : 0) - titleBarHeight);
		updateHeight();
		window.addEventListener('resize', updateHeight);
		return () => window.removeEventListener('resize', updateHeight);
	}, [streamPlay]);

	const parentRef = useRef(null);

	const rowVirtualizer = useVirtualizer({
		count: listDM.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 50,
		overscan: 5
	});

	const joinToChatAndNavigate = useCallback(
		async (DMid: string, type: number) => {
			dispatch(channelsActions.setPreviousChannels({ channelId: DMid }));
			navigate(`/chat/direct/message/${DMid}/${type}`);

			if (closeMenu) {
				setStatusMenu(false);
			}
		},
		[closeMenu]
	);

	return (
		<div
			ref={parentRef}
			className={`custom-member-list ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}
			style={{
				height: height,
				overflow: 'auto'
			}}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative'
				}}
			>
				{rowVirtualizer.getVirtualItems().map((virtualRow) => {
					const isActive = currentDmGroupId === listDM[virtualRow.index];
					return (
						<div
							key={virtualRow.index}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`
							}}
						>
							<DMListItem
								currentDmGroupId={currentDmGroupId as string}
								key={virtualRow.index}
								id={listDM[virtualRow.index]}
								isActive={isActive}
								navigateToFriends={() => navigate(`/chat/direct/friends`)}
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								joinToChatAndNavigate={isActive ? () => {} : joinToChatAndNavigate}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ListDMChannel;
