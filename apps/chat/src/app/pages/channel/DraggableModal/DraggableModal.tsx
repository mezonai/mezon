/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/accessible-emoji */
import {
	channelAppActions,
	channelsActions,
	getStore,
	handleParticipantVoiceState,
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
import type { ApiChannelAppResponseExtend } from '@mezon/utils';
import { COLLAPSED_SIZE, DEFAULT_POSITION, INIT_SIZE, MIN_POSITION, ParticipantMeetState, useWindowSize } from '@mezon/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector } from 'react-redux';

import React from 'react';
import { ChannelApps } from '../ChannelApp';

type DraggableModalTabsProps = {
	appChannelList: ApiChannelAppResponseExtend[];
	onCollapseToggle?: (() => void | undefined) | undefined;
	isCollapsed?: boolean;
	handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
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
	const userProfile = useAppSelector((state) => state.account.userProfile);
	const handleOnCloseCallback = useCallback(
		async (event: React.MouseEvent, clanId: string, channelId: string, appId: string) => {
			event.stopPropagation();

			await dispatch(
				handleParticipantVoiceState({
					clan_id: clanId,
					channel_id: channelId,
					display_name: userProfile?.user?.display_name ?? '',
					state: ParticipantMeetState.LEAVE,
					room_name: appId
				})
			);
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
		async (event: React.MouseEvent) => {
			event.stopPropagation();

			const curClanId = selectCurrentClanId(store.getState());
			dispatch(channelsActions.resetAppChannelsListShowOnPopUp({ clanId: curClanId as string }));
			appChannelList.forEach((item) => handleOnCloseCallback(event, curClanId as string, item.channel_id as string, item.app_id as string));
		},
		[dispatch, handleOnCloseCallback, appChannelList]
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
					<DraggableModalTabItem key={app.app_id} app={app} handleFocused={handleFocused} handleOnCloseCallback={handleOnCloseCallback} />
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
	handleOnCloseCallback: (event: React.MouseEvent<HTMLButtonElement>, clanId: string, channelId: string, appId: string) => void;
}

const DraggableModalTabItem: React.FC<DraggableModalTabItemProps> = ({ app, handleFocused, handleOnCloseCallback }) => {
	const dispatch = useDispatch();
	const store = getStore();
	const isFocused = selectCheckAppFocused(store.getState(), app?.channel_id as string);
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
										<Icons.StartCall className="size-3 dark:hover:text-white hover:text-black text-theme-primary" />
									)}
								</button>
								{isJoinVoice && (
									<button onClick={() => dispatch(channelAppActions.setEnableVoice(!isTalking))}>
										{isTalking ? (
											<Icons.MicEnable className="size-4 dark:hover:text-white hover:text-black text-theme-primary" />
										) : (
											<Icons.MicDisable className="size-4 text-red-600" />
										)}
									</button>
								)}
							</div>
						)}

						<button
							title="Close"
							onClick={(e) => handleOnCloseCallback(e, app.clan_id as string, app.channel_id as string, app.app_id as string)}
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
				const isFocused = selectCheckAppFocused(store.getState(), appChannel.channel_id as string);

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
	const appsList = useSelector(selectAppChannelsList);
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
						// eslint-disable-next-line react/jsx-no-useless-fragment
						<>
							{channel && (
								<div key={app.channel_id} className="flex flex-col items-center w-[100px]">
									<button
										onClick={() => onClickAppItem(app as ApiChannelAppResponseExtend)}
										className="w-16 h-16 flex items-center justify-center bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-all duration-200"
										title={channel?.channel_label}
									>
										🌐
									</button>
									<span className="max-w-[100px] truncate overflow-hidden whitespace-nowrap">{channel?.channel_label}</span>
								</div>
							)}
						</>
					);
				})}
			</div>
		</div>
	);
};

type ResizeHandlesProps = {
	handleResizeMouseDown: (direction: string) => (event: React.MouseEvent<HTMLDivElement>) => void;
};

const ResizeHandles: React.FC<ResizeHandlesProps> = memo(({ handleResizeMouseDown }) => (
	<>
		<div className="absolute top-0 left-1 w-[calc(100%-8px)] h-1 cursor-n-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('n')} />
		<div
			className="absolute bottom-0 left-1 w-[calc(100%-8px)] h-1 cursor-s-resize z-50 resize-handle"
			onMouseDown={handleResizeMouseDown('s')}
		/>
		<div className="absolute left-0 top-1 h-[calc(100%-8px)] w-1 cursor-w-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('w')} />
		<div className="absolute right-0 top-1 h-[calc(100%-8px)] w-1 cursor-e-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('e')} />
		<div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('se')} />
		<div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('sw')} />
		<div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('ne')} />
		<div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50 resize-handle" onMouseDown={handleResizeMouseDown('nw')} />
	</>
));

interface DraggableModalProps {
	initialWidth?: number;
	initialHeight?: number;
	aspectRatio?: number | null;
	appChannelList?: ApiChannelAppResponseExtend[];
	inVisible?: boolean;
}

const DraggableModal: React.FC<DraggableModalProps> = memo(({ appChannelList, inVisible }) => {
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
			if (!e.target || !(e.target as HTMLElement).classList.contains('resize-handle')) {
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
				const newPosition = {
					x: modalPosition.x + e.movementX,
					y: modalPosition.y + e.movementY
				};

				setModalPosition(newPosition);
				dispatch(channelAppActions.setPosition(newPosition));
			} else if (resizeDirection) {
				let newWidth = modalSize.width;
				let newHeight = modalSize.height;
				let newX = modalPosition.x;
				let newY = modalPosition.y;

				if (resizeDirection.includes('e')) {
					newWidth = Math.max(200, modalSize.width + e.movementX);
				}
				if (resizeDirection.includes('w')) {
					const deltaWidth = e.movementX;
					newWidth = Math.max(200, modalSize.width - deltaWidth);
					if (newWidth !== modalSize.width) {
						newX = modalPosition.x + (modalSize.width - newWidth);
					}
				}
				if (resizeDirection.includes('s')) {
					newHeight = Math.max(200, modalSize.height + e.movementY);
				}
				if (resizeDirection.includes('n')) {
					const deltaHeight = e.movementY;
					newHeight = Math.max(200, modalSize.height - deltaHeight);
					if (newHeight !== modalSize.height) {
						newY = modalPosition.y + (modalSize.height - newHeight);
					}
				}

				setModalSize({ width: newWidth, height: newHeight });
				setModalPosition({ x: newX, y: newY });

				dispatch(channelAppActions.setSize({ width: newWidth, height: newHeight }));
				dispatch(channelAppActions.setPosition({ x: newX, y: newY }));
			}
		},
		[dragging, resizeDirection, modalSize, modalPosition, dispatch]
	);

	const handleMouseUp = useCallback(() => {
		setDragging(false);
		setResizeDirection(null);
		setOverlay(false);
	}, []);

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

	const modalStyle = inVisible ? { height: 0, visibility: 'hidden' as const } : {};

	const [showModal, hideModal] = useModal(() => {
		return (
			isShowModal && (
				<div
					ref={modalElementRef}
					className="none-draggable-area fixed bg-[#212121] shadow-lg rounded-xl contain-strict z-50"
					style={{
						left: `${(dragging ? modalPosition : storedPosition || DEFAULT_POSITION).x}px`,
						top: `${(dragging ? modalPosition : storedPosition || DEFAULT_POSITION).y}px`,
						width: `${modalSize.width}px`,
						height: `${modalSize.height}px`,
						display: 'flex',
						flexDirection: 'column',
						minHeight: `${COLLAPSED_SIZE.height}px`,
						...modalStyle
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
			)
		);
	}, [
		isShowModal,
		modalStyle,
		dragging,
		modalPosition,
		storedPosition,
		modalSize,
		overlay,
		isCollapsed,
		isFullSize,
		handleMouseDown,
		onCollapseToggle,
		onFullSizeToggle,
		handleResizeMouseDown,
		appChannelList
	]);

	useEffect(() => {
		if (isShowModal) {
			if (!storedPosition || (storedPosition.x === DEFAULT_POSITION.x && storedPosition.y === DEFAULT_POSITION.y)) {
				const windowWidth = window.innerWidth;
				const windowHeight = window.innerHeight;
				const centerX = Math.max(0, (windowWidth - modalSize.width) / 2);
				const centerY = Math.max(0, (windowHeight - modalSize.height) / 2);
				dispatch(channelAppActions.setPosition({ x: centerX, y: centerY }));
			} else {
				setModalPosition(storedPosition);
			}
			showModal();
		} else {
			hideModal();
		}
	}, [isShowModal, showModal, hideModal, storedPosition, modalSize, dispatch]);

	return null;
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
