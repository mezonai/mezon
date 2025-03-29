/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/accessible-emoji */
import {
	channelAppActions,
	channelsActions,
	getStore,
	selectAppChannelsList,
	selectAppFocusedChannel,
	selectChannelById,
	selectCheckAppFocused,
	selectCurrentClanId,
	selectEnableCall,
	selectEnableMic,
	selectGetRoomId,
	selectPostionPopupApps,
	selectSizePopupApps,
	selectToCheckAppIsOpening,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ASPECT_RATIO, ApiChannelAppResponseExtend, COLLAPSED_SIZE, DEFAULT_POSITION, INIT_SIZE, MIN_POSITION, useWindowSize } from '@mezon/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChannelApps } from '../ChannelApp';

import React from 'react';

type DraggableModalTabsProps = {
	appChannelList: ApiChannelAppResponseExtend[];
	onCollapseToggle?: (() => void | undefined) | undefined;
	isCollapsed?: boolean;
	handleMouseDown: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	onFullSizeToggle?: () => void;
	isFullSize?: boolean;
};

const DraggableModalTabs: React.FC<DraggableModalTabsProps> = ({
	appChannelList,
	onCollapseToggle,
	isCollapsed,
	handleMouseDown,
	onFullSizeToggle,
	isFullSize
}) => {
	const dispatch = useAppDispatch();
	const store = getStore();

	const handleOnCloseCallback = useCallback(
		(event: React.MouseEvent, clanId: string, channelId: string) => {
			event.stopPropagation();

			dispatch(
				channelsActions.removeAppChannelsListShowOnPopUp({
					clanId,
					channelId
				})
			);
		},
		[dispatch]
	);

	const handleFocused = useCallback(
		(event: React.MouseEvent, app: ApiChannelAppResponseExtend) => {
			event.stopPropagation();
			dispatch(channelsActions.setAppChannelFocus({ app: app as ApiChannelAppResponseExtend }));
		},
		[dispatch]
	);

	const handleCloseAllTabs = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();

			const curClanId = selectCurrentClanId(store.getState());
			dispatch(channelsActions.resetAppChannelsListShowOnPopUp({ clanId: curClanId as string }));
		},
		[dispatch]
	);

	const handlePlusClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();

			const clanId = selectCurrentClanId(store.getState());
			const timestamp = Date.now().toString();
			const blankApp: ApiChannelAppResponseExtend = {
				clan_id: clanId as string,
				channel_id: timestamp,
				app_id: timestamp,
				id: timestamp,
				isBlank: true
			};

			dispatch(
				channelsActions.setAppChannelsListShowOnPopUp({
					clanId: blankApp.clan_id as string,
					channelId: blankApp.channel_id as string,
					appChannel: blankApp
				})
			);
		},
		[dispatch]
	);

	return (
		<div onMouseDown={handleMouseDown} className="flex items-center justify-between bg-[#1E1F22] z-50">
			{/* close_button */}
			<div className="w-[60px] h-[48px] justify-center bg-transparent flex items-center">
				<button
					onClick={(event) => handleCloseAllTabs(event)}
					title="Close all tabs"
					className="left-0 flex items-center justify-center text-[#B5BAC1] text-sm font-bold rounded-full w-[30px] h-[30px] bg-gray-800"
				>
					✕
				</button>
			</div>
			<div className={`flex items-center flex-1 overflow-x-auto scrollbar-hide h-[${COLLAPSED_SIZE.height}px]`}>
				{appChannelList.map((app) => (
					<DraggableModalTabItem key={app?.app_id} app={app} handleFocused={handleFocused} handleOnCloseCallback={handleOnCloseCallback} />
				))}
				<div className="w-[60px] h-[48px] justify-center bg-transparent flex items-center">
					{' '}
					<button
						onClick={(event) => handlePlusClick(event)}
						title="Open new tab"
						className="left-0 flex items-center justify-center text-[#B5BAC1] text-sm font-bold rounded-full w-[30px] h-[30px] bg-gray-800 rotate-45"
					>
						✕
					</button>
				</div>
			</div>
			<div className="w-[60px] h-[48px] justify-center bg-transparent flex items-center right-3">
				<button
					onClick={onCollapseToggle}
					title={isCollapsed ? 'Expand tabs' : 'Collapse tabs'}
					className="left-0 flex items-center justify-center text-[#B5BAC1] text-sm  rounded-full w-[30px] h-[30px]"
				>
					{isCollapsed ? '▼' : '▲'}
				</button>
				<button
					onClick={onFullSizeToggle}
					title={isFullSize ? 'Exit Full Screen' : 'Enter Full Screen'}
					className="left-0 flex items-center justify-center text-[#B5BAC1] text-sm rounded-full w-[30px] h-[30px]"
				>
					{isFullSize ? '🗗' : '⛶'}
				</button>
			</div>
		</div>
	);
};

interface DraggableModalTabItemProps {
	app: ApiChannelAppResponseExtend;
	handleFocused: (event: React.MouseEvent<HTMLDivElement>, app: ApiChannelAppResponseExtend) => void;
	handleOnCloseCallback: (event: React.MouseEvent<HTMLButtonElement>, clanId: string, channelId: string) => void;
}

const DraggableModalTabItem: React.FC<DraggableModalTabItemProps> = ({ app, handleFocused, handleOnCloseCallback }) => {
	const dispatch = useDispatch();
	const store = getStore();
	const isFocused = selectCheckAppFocused(store.getState(), app?.clan_id as string, app?.channel_id as string);
	const channel = selectChannelById(store.getState(), app?.channel_id as string);
	const roomId = useAppSelector((state) => selectGetRoomId(state, app?.channel_id));
	const isJoinVoice = useSelector(selectEnableCall);
	const isTalking = useSelector(selectEnableMic);
	return (
		<div onClick={(event) => handleFocused(event, app as ApiChannelAppResponseExtend)}>
			<div
				title={channel?.channel_label}
				className={`rounded-t-xl flex items-center transition-all duration-300 ease-in-out relative gap-2 ${
					isFocused ? 'w-fit min-w-[270px] px-2 pr-8 bg-black' : 'w-[60px] justify-center bg-transparent'
				} h-[48px]`}
			>
				{/* Avatar */}
				<span className="text-white text-xs font-bold w-[30px] h-[30px] bg-slate-800 flex justify-center items-center rounded-full">
					{(channel?.channel_label || 'New tab').charAt(0).toLocaleUpperCase()}
				</span>

				{isFocused && <span className="text-white text-sm font-medium truncate max-w-[120px]">{channel?.channel_label || 'New tab'}</span>}
				{isFocused && (
					<div className="flex flex-row items-center gap-2 absolute right-2">
						{roomId && (
							<div
								className="flex justify-between items-center gap-2 text-sm text-white"
								onMouseEnter={(event) => event.stopPropagation()}
							>
								<button
									onClick={() => {
										dispatch(channelAppActions.setEnableCall(!isJoinVoice));
										if (isJoinVoice) {
											dispatch(channelAppActions.setEnableVoice(false));
											dispatch(channelAppActions.setRoomToken(undefined));
										}
									}}
								>
									{isJoinVoice ? (
										<Icons.StopCall className="size-4 text-red-600" />
									) : (
										<Icons.StartCall className="size-3 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
									)}
								</button>
								{isJoinVoice && (
									<button onClick={() => dispatch(channelAppActions.setEnableVoice(!isTalking))}>
										{isTalking ? (
											<Icons.MicDisable className="size-4 text-red-600" />
										) : (
											<Icons.MicEnable className="size-4 dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode" />
										)}
									</button>
								)}
							</div>
						)}

						<button
							title="Close"
							onClick={(e) => handleOnCloseCallback(e, app.clan_id as string, app.channel_id as string)}
							className="flex items-center justify-center text-[#B5BAC1] text-sm hover:text-white transition"
						>
							✕
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

type ModalContentProps = {
	isCollapsed: boolean;
	appChannelList: ApiChannelAppResponseExtend[];
};

const ModalContent: React.FC<ModalContentProps> = memo(({ isCollapsed, appChannelList }) => {
	const contentStyle = isCollapsed ? { height: 0, visibility: 'hidden' as const } : {};
	const store = getStore();

	return (
		<div className="relative w-full h-full">
			{appChannelList?.map((appChannel) => {
				const isFocused = selectCheckAppFocused(store.getState(), appChannel?.clan_id as string, appChannel?.channel_id as string);

				return (
					<div
						key={appChannel.channel_id}
						className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out ${
							isFocused ? 'z-10 opacity-100' : 'z-0 opacity-0'
						}`}
						style={contentStyle}
					>
						{appChannel?.isBlank ? <BlankChannelComponent /> : <ChannelApps appChannel={appChannel} />}
					</div>
				);
			})}
		</div>
	);
});

const BlankChannelComponent: React.FC = () => {
	const appsList = useAppSelector((state) => selectAppChannelsList(state, ''));

	const dispatch = useDispatch();
	const store = getStore();

	const onClickAppItem = (app: ApiChannelAppResponseExtend) => {
		const appIsOpening = selectToCheckAppIsOpening(store.getState(), app.channel_id as string);
		const getAppFocused = selectAppFocusedChannel(store.getState());
		if (appIsOpening) {
			dispatch(channelsActions.setAppChannelFocus({ app: app as ApiChannelAppResponseExtend }));
		} else {
			dispatch(
				channelsActions.replaceAppChannelsListShowOnPopUp({
					clanId: getAppFocused?.clan_id as string,
					channelId: getAppFocused?.channel_id as string,
					newApp: app
				})
			);
		}
	};

	return (
		<div className="flex justify-center flex-col w-full h-full bg-[#313338] text-gray-500 border border-gray-800">
			{/* Search Bar */}
			<div className="px-4 py-3 w-full">
				<div className="bg-gray-800 rounded-full flex items-center px-4 py-2">
					<input type="text" placeholder="Search Apps" className="bg-transparent border-none outline-none text-white w-full" />
				</div>
			</div>

			{/* Apps List */}
			<div className="w-full flex flex-wrap gap-4 px-4 justify-center">
				{appsList.map((app) => {
					const channel = selectChannelById(store.getState(), app.channel_id as string);

					return (
						<div key={app.channel_id} className="flex flex-col items-center">
							<button
								onClick={() => onClickAppItem(app as ApiChannelAppResponseExtend)}
								className="w-16 h-16 flex items-center justify-center bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-all duration-200"
								title={app.url || 'Unnamed App'}
							>
								🌐
							</button>
							<span>{channel?.channel_label || 'Unknown'}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

type ResizeHandlesProps = {
	handleResizeMouseDown: (dir: string) => (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const ResizeHandles: React.FC<ResizeHandlesProps> = memo(({ handleResizeMouseDown }) => (
	<>
		<div className="absolute top-0 left-1 w-[calc(100%-8px)] h-1 cursor-n-resize z-50 " onMouseDown={handleResizeMouseDown('top')} />
		<div className="absolute bottom-0 left-1 w-[calc(100%-8px)] h-1 cursor-s-resize z-50 " onMouseDown={handleResizeMouseDown('bottom')} />
		<div className="absolute left-0 top-1 h-[calc(100%-8px)] w-1 cursor-w-resize z-50 " onMouseDown={handleResizeMouseDown('left')} />
		<div className="absolute right-0 top-1 h-[calc(100%-8px)] w-1 cursor-e-resize z-50 " onMouseDown={handleResizeMouseDown('right')} />
		<div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50 " onMouseDown={handleResizeMouseDown('bottom-right')} />
		<div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50 " onMouseDown={handleResizeMouseDown('bottom-left')} />
		<div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50 " onMouseDown={handleResizeMouseDown('top-right')} />
		<div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50 " onMouseDown={handleResizeMouseDown('top-left')} />
	</>
));

interface DraggableModalProps {
	isVisible?: boolean;
	clanId?: string;
	appChannelList?: ApiChannelAppResponseExtend[];
}

const DraggableModal: React.FC<DraggableModalProps> = memo(({ isVisible, clanId, appChannelList }) => {
	console.log('appChannelList :', appChannelList);
	// const appChannelList = useAppSelector((state: RootState) => selectAppChannelsListShowOnPopUp(state, clanId as string));
	// const appChannelList = useAppSelector((state) => selectAppChannelsListShowOnPopUp(state));
	const isShowModal = appChannelList && appChannelList.length > 0;

	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isFullSize, setIsFullSize] = useState(false);
	const { width, height } = useWindowSize();

	const modalElementRef = useRef<HTMLDivElement>(null);
	const dispatch = useDispatch();
	const [dragging, setDragging] = useState(false);
	const [resizeDirection, setResizeDirection] = useState<string | null>(null);
	const storedPosition = useSelector(selectPostionPopupApps);
	const storedSize = useSelector(selectSizePopupApps);
	const [modalSize, setModalSize] = useState(storedSize || INIT_SIZE);
	const [modalPosition, setModalPosition] = useState(storedPosition || DEFAULT_POSITION);
	const [overlay, setOverlay] = useState(false);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setResizeDirection(null);
			if (e.target instanceof HTMLDivElement && e.target.dataset.resize) {
				setResizeDirection(e.target.dataset.resize);
			} else {
				setDragging(true);
			}
		},
		[modalPosition, overlay]
	);

	const onFullSizeToggle = useCallback(() => {
		setIsFullSize((prev) => {
			const nextFullSize = !prev;
			setIsCollapsed(false);
			setDragging(false);
			setResizeDirection(null);
			setModalSize(nextFullSize ? { width, height } : storedSize);
			setModalPosition(nextFullSize ? MIN_POSITION : storedPosition);
			return nextFullSize;
		});
	}, [width, height, storedPosition, storedSize]);

	const onCollapseToggle = useCallback(() => {
		setIsCollapsed((prev) => {
			const nextCollapsed = !prev;
			setDragging(false);
			setResizeDirection(null);
			setModalSize(nextCollapsed ? COLLAPSED_SIZE : storedSize);
			if (isFullSize) {
				setModalPosition(MIN_POSITION);
				setModalSize(storedSize);
			}
			return nextCollapsed;
		});
	}, [storedSize]);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!dragging && !resizeDirection) return;

			setOverlay(true);
			if (dragging) {
				setModalPosition((prev) => ({
					x: Math.max(0, Math.min(prev.x + e.movementX, window.innerWidth - modalSize.width)),
					y: Math.max(0, Math.min(prev.y + e.movementY, window.innerHeight - modalSize.height))
				}));
			} else if (resizeDirection) {
				let newWidth = modalSize.width;
				let newHeight = modalSize.height;
				let newX = modalPosition.x;
				let newY = modalPosition.y;
				const isCorner = resizeDirection.includes('-');
				const shouldMaintainAspect = ASPECT_RATIO && isCorner;

				if (resizeDirection.includes('right')) {
					newWidth = Math.min(modalSize.width + e.movementX, window.innerWidth - modalPosition.x);
				}
				if (resizeDirection.includes('left')) {
					newWidth = Math.min(modalSize.width - e.movementX, window.innerWidth - newX);
					newX = Math.max(0, newX + e.movementX);
				}
				if (resizeDirection.includes('bottom')) {
					newHeight = Math.min(modalSize.height + e.movementY, window.innerHeight - modalPosition.y);
				}
				if (resizeDirection.includes('top')) {
					newHeight = Math.min(modalSize.height - e.movementY, window.innerHeight - newY);
					newY = Math.max(0, newY + e.movementY);
				}

				if (shouldMaintainAspect) {
					newHeight = newWidth / ASPECT_RATIO;
				}

				setModalSize({ width: newWidth, height: newHeight });
				setModalPosition({ x: newX, y: newY });
			}
		},
		[dragging, resizeDirection, modalSize, modalPosition, ASPECT_RATIO, overlay]
	);

	const handleMouseUp = useCallback(() => {
		if (modalElementRef.current) {
			const isSameAsWindowSize = modalSize.width === width && modalSize.height === height;
			const isSameAsCollapsedSize = modalSize.width === COLLAPSED_SIZE.width && modalSize.height === COLLAPSED_SIZE.height;
			if (!isSameAsCollapsedSize && !isSameAsWindowSize) {
				dispatch(channelAppActions.setPosition({ x: modalPosition.x, y: modalPosition.y }));
				dispatch(channelAppActions.setSize({ width: modalSize.width, height: modalSize.height }));
			}
		}
		setDragging(false);
		setResizeDirection(null);
		setOverlay(false);
	}, [dispatch, modalPosition, modalSize, width, height]);

	const handleResizeMouseDown = useCallback((dir: string) => {
		return (e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			setResizeDirection(dir);
		};
	}, []);

	useEffect(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);
	const modalStyle = isVisible ? {} : { opacity: 0, visibility: 'hidden' as const, pointerEvents: 'none' as const };
	return (
		isShowModal && (
			<div className="relative">
				<div
					ref={modalElementRef}
					className="absolute bg-[#212121] shadow-lg rounded-xl contain-strict z-50"
					style={{
						// ...modalStyle,
						left: `${modalPosition.x}px`,
						top: `${modalPosition.y}px`,
						width: `${modalSize.width}px`,
						height: `${modalSize.height}px`,
						display: 'flex',
						flexDirection: 'column',
						minHeight: `${COLLAPSED_SIZE.height}px`
					}}
					onMouseDown={handleMouseDown}
				>
					{overlay && <Overlay />}
					<DraggableModalTabs
						appChannelList={appChannelList}
						onCollapseToggle={onCollapseToggle}
						isCollapsed={isCollapsed}
						handleMouseDown={handleMouseDown}
						onFullSizeToggle={onFullSizeToggle}
						isFullSize={isFullSize}
					/>
					<ModalContent isCollapsed={isCollapsed} appChannelList={appChannelList} />
					{!isCollapsed && <ResizeHandles handleResizeMouseDown={handleResizeMouseDown} />}
				</div>
			</div>
		)
	);
});

export default DraggableModal;

const Overlay: React.FC = () => {
	return (
		<div
			className="absolute inset-0  bg-transparent z-40 cursor-pointer rounded-b-lg"
			style={{ top: `${COLLAPSED_SIZE.height}`, height: `calc(100% - ${COLLAPSED_SIZE.height})` }}
		/>
	);
};
