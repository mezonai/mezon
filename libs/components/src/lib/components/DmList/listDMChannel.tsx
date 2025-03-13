import { useAppParams, useMenu } from '@mezon/core';
import {
	channelsActions,
	selectCloseMenu,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectStatusStream,
	useAppDispatch
} from '@mezon/store';
import { isLinuxDesktop, isWindowsDesktop, toggleDisableHover } from '@mezon/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DMListItem from './DMListItem';

type ListDMChannelProps = {
	listDM: string[];
};

const heightAroundComponent = 230;
const heightAppUpdate = 40;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;
const ListDMChannel = ({ listDM }: ListDMChannelProps) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { directId: currentDmGroupId } = useAppParams();
	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const streamPlay = useSelector(selectStatusStream);
	const isInCall = useSelector(selectIsInCall);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);

	const calculateHeight = useCallback(() => {
		const baseHeight = window.innerHeight - heightAroundComponent;
		const streamAdjustment = streamPlay ? 56 : 0;
		const callAdjustment = isInCall ? 56 : 0;
		const electronAdjustment = IsElectronDownloading || isElectronUpdateAvailable ? heightAppUpdate : 0;

		return baseHeight - streamAdjustment - callAdjustment - titleBarHeight - electronAdjustment;
	}, [IsElectronDownloading, isElectronUpdateAvailable, streamPlay, isInCall]);

	const [height, setHeight] = useState(calculateHeight());

	useEffect(() => {
		const updateHeight = () => setHeight(calculateHeight());
		updateHeight();
		window.addEventListener('resize', updateHeight);
		return () => window.removeEventListener('resize', updateHeight);
	}, [calculateHeight]);

	const parentRef = useRef(null);

	const rowVirtualizer = useVirtualizer({
		count: listDM.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 43
	});

	const joinToChatAndNavigate = useCallback(
		async (DMid: string, type: number) => {
			dispatch(channelsActions.setPreviousChannels({ channelId: DMid, clanId: '0' }));
			navigate(`/chat/direct/message/${DMid}/${type}`);
			if (closeMenu) {
				setStatusMenu(false);
			}
		},
		[closeMenu]
	);

	const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);

	return (
		<div
			ref={parentRef}
			className={`thread-scroll`}
			style={{
				height: height,
				overflow: 'auto'
			}}
			onWheelCapture={() => {
				toggleDisableHover(parentRef.current, scrollTimeoutId2);
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
