import { useAppParams, useMenu } from '@mezon/core';
import {
	directActions,
	getStore,
	selectCloseMenu,
	selectDirectHasMore,
	selectDirectPaginationLoading,
	selectIsElectronDownloading,
	selectIsElectronUpdateAvailable,
	selectIsInCall,
	selectStatusStream,
	selectVoiceJoined,
	useAppDispatch
} from '@mezon/store';
import { generateE2eId, isLinuxDesktop, isWindowsDesktop, toggleDisableHover } from '@mezon/utils';
import { memo, useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '../../components';
import DMListItem from './DMListItem';

type ListDMChannelProps = {
	listDM: string[];
};

const heightAroundComponent = 232;
const heightAppUpdate = 40;
const titleBarHeight = isWindowsDesktop || isLinuxDesktop ? 21 : 0;
const SCROLL_THRESHOLD = 100;

const PaginationLoadingIndicator = memo(({ isFetchingRef }: { isFetchingRef: MutableRefObject<boolean> }) => {
	const paginationLoading = useSelector(selectDirectPaginationLoading);

	if (!paginationLoading) {
		isFetchingRef.current = false;
		return null;
	}

	return (
		<div className="flex justify-center py-2">
			<div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
		</div>
	);
});

const ListDMChannel = ({ listDM }: ListDMChannelProps) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { directId: currentDmGroupId } = useAppParams();
	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const streamPlay = useSelector(selectStatusStream);
	const isInCall = useSelector(selectIsInCall);
	const isElectronUpdateAvailable = useSelector(selectIsElectronUpdateAvailable);
	const IsElectronDownloading = useSelector(selectIsElectronDownloading);
	const isVoiceJoined = useSelector(selectVoiceJoined);
	const calculateHeight = useCallback(() => {
		const baseHeight = window.innerHeight - heightAroundComponent;
		const streamAdjustment = streamPlay ? 56 : 0;
		const callAdjustment = isInCall ? 56 : 0;
		const voiceAdjustment = isVoiceJoined ? 96 : 0;
		const electronAdjustment = IsElectronDownloading || isElectronUpdateAvailable ? heightAppUpdate : 0;

		return baseHeight - streamAdjustment - callAdjustment - titleBarHeight - electronAdjustment - voiceAdjustment;
	}, [IsElectronDownloading, isElectronUpdateAvailable, streamPlay, isInCall, isVoiceJoined]);

	const [height, setHeight] = useState(calculateHeight());

	useEffect(() => {
		const updateHeight = () => setHeight(calculateHeight());
		updateHeight();
		window.addEventListener('resize', updateHeight);
		return () => window.removeEventListener('resize', updateHeight);
	}, [calculateHeight]);

	const parentRef = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: listDM.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 43
	});

	const joinToChatAndNavigate = useCallback(
		async (DMid: string, type: number) => {
			navigate(`/chat/direct/message/${DMid}/${type}`);
			if (closeMenu) {
				setStatusMenu(false);
			}
		},
		[closeMenu]
	);

	const scrollRAF = useRef(0);
	const isFetchingRef = useRef(false);

	const handleScroll = useCallback(() => {
		if (scrollRAF.current) return;
		scrollRAF.current = requestAnimationFrame(() => {
			scrollRAF.current = 0;
			if (isFetchingRef.current) return;
			const scrollElement = parentRef.current;
			const state = getStore().getState();
			const hasMore = selectDirectHasMore(state);
			const isLoading = selectDirectPaginationLoading(state);
			if (!scrollElement || !hasMore || isLoading) return;

			const { scrollTop, scrollHeight, clientHeight } = scrollElement;
			const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

			if (distanceFromBottom < SCROLL_THRESHOLD) {
				isFetchingRef.current = true;
				dispatch(directActions.fetchMoreDirectMessages({}));
			}
		});
	}, [dispatch]);

	const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);

	return (
		<div
			ref={parentRef}
			className={`messages-scroll`}
			style={{
				height,
				overflow: 'auto'
			}}
			onScroll={handleScroll}
			onWheelCapture={() => {
				toggleDisableHover(parentRef.current, scrollTimeoutId2);
			}}
			data-e2e={generateE2eId('chat.direct_message.chat_list_container')}
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
							className="dm-wrap"
						>
							<DMListItem
								currentDmGroupId={currentDmGroupId as string}
								key={virtualRow.index}
								id={listDM[virtualRow.index]}
								isActive={isActive}
								navigateToFriends={() => navigate(`/chat/direct/friends`)}
								joinToChatAndNavigate={isActive ? () => {} : joinToChatAndNavigate}
							/>
						</div>
					);
				})}
			</div>
			<PaginationLoadingIndicator isFetchingRef={isFetchingRef} />
		</div>
	);
};

export default ListDMChannel;
