import { useAppNavigation, useWindowSize } from '@mezon/core';
import { channelAppActions, selectEnableCall, selectEnableMic, selectGetRoomId } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
type ModalHeaderProps = {
	onClose: () => void;
	handleMouseDown: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	title?: string;
	isFocused?: boolean;
	clanId?: string;
	channelId?: string;
	onCollapseToggle?: () => void;
	isCollapsed?: boolean;
};

const ModalHeader = memo(({ title, onClose, handleMouseDown, isFocused, clanId, channelId, onCollapseToggle, isCollapsed }: ModalHeaderProps) => {
	const dispatch = useDispatch();
	const isJoinVoice = useSelector(selectEnableCall);
	const isTalking = useSelector(selectEnableMic);
	const roomId = useSelector(selectGetRoomId);
	const bgColor = isFocused ? 'bg-[#1E1F22]' : 'bg-[#404249]';
	const roundedBottom = isCollapsed ? 'rounded-b-lg' : '';
	const { navigate, toChannelPage } = useAppNavigation();
	const onBack = useCallback(() => {
		const channelPath = toChannelPage(channelId ?? '', clanId ?? '');
		navigate(channelPath);
	}, [toChannelPage, navigate, channelId, clanId]);

	return (
		<div
			className={`rounded-t-lg px-3 py-1 flex items-center justify-between relative  w-full ${bgColor} ${roundedBottom}`}
			onMouseDown={handleMouseDown}
		>
			<span className="text-sm text-white  truncate" style={{ maxWidth: '150px' }}>
				{title}
			</span>
			<div className="absolute top-0 right-0 flex ">
				{roomId && (
					<div className="flex justify-between items-center gap-2 text-sm text-white ">
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
				<div className="group relative">
					<button
						onClick={onCollapseToggle}
						className="w-7 h-7 flex items-center justify-center text-[#B5BAC1] text-sm hover:bg-[#404249] hover:text-white transition"
						title={isCollapsed ? 'Expand' : 'Collapse'}
					>
						{isCollapsed ? '▼' : '▲'}
					</button>
				</div>
				<div className="group relative">
					<button
						onClick={onBack}
						className="w-7 h-7 flex items-center justify-center text-[#B5BAC1] text-sm hover:bg-[#404249] hover:text-white transition"
						title="Back"
					>
						↩
					</button>
				</div>

				<div className="group relative">
					<button
						title="Close"
						onClick={onClose}
						className="w-7 h-7 flex items-center justify-center text-[#B5BAC1] text-sm hover:bg-[#404249] hover:text-white transition rounded-tr-lg "
					>
						✕
					</button>
				</div>
			</div>
		</div>
	);
});

type ModalContentProps = {
	children: React.ReactNode;
	isDragging: boolean;
	resizeDir: string | null;
	isCollapsed: boolean;
};

const ModalContent: React.FC<ModalContentProps> = memo(({ children, isDragging, resizeDir, isCollapsed }) => {
	const contentStyle = isCollapsed ? { height: 0, visibility: 'hidden' as const } : {};

	return (
		<div className={`flex-1 overflow-auto relative p-0.1`} style={contentStyle}>
			{children}
			{(isDragging || resizeDir) && <div className="absolute inset-0" style={{ background: 'transparent', zIndex: 10 }} />}
		</div>
	);
});

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

type OverlayProps = {
	isFocused?: boolean;
	onFocus?: () => void;
	headerHeight: number;
};

const Overlay: React.FC<OverlayProps> = ({ isFocused, onFocus, headerHeight }) => {
	if (isFocused) return null;

	return (
		<div
			className="absolute inset-0 bg-black opacity-20 z-50 cursor-pointer rounded-b-lg"
			onClick={onFocus}
			style={{ top: `${headerHeight}px`, height: `calc(100% - ${headerHeight}px)` }}
		/>
	);
};

interface DraggableModalProps {
	onClose: () => void;
	onFocus: () => void;
	children: React.ReactNode;
	parentRef: React.RefObject<HTMLDivElement>;
	initialWidth?: number;
	initialHeight?: number;
	aspectRatio?: number | null;
	headerTitle?: string;
	isFocused?: boolean;
	zIndex?: string;
	clanId?: string;
	channelId?: string;
}

const DraggableModal: React.FC<DraggableModalProps> = memo(
	({
		onClose,
		children,
		parentRef,
		initialWidth = 430,
		initialHeight = 630,
		aspectRatio = null,
		headerTitle,
		isFocused,
		onFocus,
		zIndex,
		clanId,
		channelId
	}) => {
		const modalRef = useRef<HTMLDivElement>(null);
		const { height, width } = useWindowSize();
		const [position, setPosition] = useState({ x: 100, y: 100 });
		const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
		const [isDragging, setIsDragging] = useState(false);
		const [resizeDir, setResizeDir] = useState<string | null>(null);
		const [bounds, setBounds] = useState({ minX: 0, maxX: width, minY: 0, maxY: height });
		const headerHeight = 28;
		const [isCollapsed, setIsCollapsed] = useState(false);
		const onCollapseToggle = useCallback(() => {
			setIsCollapsed((prev) => {
				const newHeight = prev ? initialHeight : 10;
				const newWidth = prev ? initialWidth : 240;

				setSize((prevSize) => ({
					...prevSize,
					height: newHeight,
					width: newWidth
				}));

				return !prev;
			});
		}, [initialHeight, initialWidth]);

		useEffect(() => {
			const parent = parentRef?.current;
			if (!parent) return;
			const updateBounds = () => {
				setBounds({
					minX: 0,
					maxX: width - size.width,
					minY: 0,
					maxY: height - size.height
				});
			};

			const updatePositon = () => {
				const isOverHorizontal = position.y + size.height > height;
				const isOverVertical = position.x + size.width > width;

				const isUnderHorizontal = position.y < 0;
				const isUnderVertical = position.x < 0;

				if (isOverHorizontal) {
					setPosition({
						x: position.x,
						y: height - size.height
					});
				} else if (isUnderHorizontal) {
					setPosition({
						x: position.x,
						y: 0
					});
				}

				if (isOverVertical) {
					setPosition({
						x: width - size.width,
						y: position.y
					});
				} else if (isUnderVertical) {
					setPosition({
						x: 0,
						y: position.y
					});
				}

				if (isOverHorizontal && isOverVertical) {
					setPosition({
						x: width - size.width,
						y: height - size.height
					});
				} else if (isUnderHorizontal && isUnderVertical) {
					setPosition({
						x: 0,
						y: 0
					});
				}
			};

			updateBounds();
			updatePositon();
			const handleResize = () => {
				updateBounds();
				updatePositon();
			};

			window.addEventListener('resize', handleResize);
			const resizeObserver = new ResizeObserver(handleResize);
			resizeObserver.observe(parent);
			return () => {
				resizeObserver.disconnect();
				window.removeEventListener('resize', handleResize);
			};
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [height, width, size, parentRef.current]);

		const handleMouseMove = useCallback(
			(e: MouseEvent) => {
				if (!isDragging && !resizeDir) return;

				if (isDragging) {
					setPosition((prev) => ({
						x: Math.min(Math.max(prev.x + e.movementX, bounds.minX), bounds.maxX),
						y: Math.min(Math.max(prev.y + e.movementY, bounds.minY), bounds.maxY)
					}));
				} else if (resizeDir) {
					let newWidth = size.width;
					let newHeight = size.height;
					let newX = position.x;
					let newY = position.y;

					const isCorner = resizeDir.includes('-');
					const shouldMaintainAspect = aspectRatio && isCorner;

					if (resizeDir.includes('right')) {
						newWidth = Math.max(300, size.width + e.movementX);
					}
					if (resizeDir.includes('left')) {
						newWidth = Math.max(300, size.width - e.movementX);
						newX += e.movementX;
					}
					if (resizeDir.includes('bottom')) {
						newHeight = Math.max(200, size.height + e.movementY);
					}
					if (resizeDir.includes('top')) {
						newHeight = Math.max(200, size.height - e.movementY);
						newY += e.movementY;
					}

					if (shouldMaintainAspect && aspectRatio) {
						if (resizeDir === 'top-left' || resizeDir === 'bottom-right') {
							newHeight = newWidth / aspectRatio;
							if (resizeDir === 'top-left') {
								newY = position.y + (size.height - newHeight);
							}
						} else if (resizeDir === 'top-right' || resizeDir === 'bottom-left') {
							newHeight = newWidth / aspectRatio;
							if (resizeDir === 'top-right') {
								newY = position.y + (size.height - newHeight);
							}
						}
					}

					const parent = parentRef?.current;
					if (parent) {
						const parentRect = parent.getBoundingClientRect();
						newWidth = Math.min(newWidth, parentRect.width - newX);
						newHeight = Math.min(newHeight, parentRect.height - newY);
						newWidth = Math.max(newWidth, 300);
						newHeight = Math.max(newHeight, 200);
						if (shouldMaintainAspect && aspectRatio) {
							newHeight = newWidth / aspectRatio;
						}
					}

					setSize({ width: newWidth, height: newHeight });
					setPosition({ x: newX, y: newY });
				}
			},
			[isDragging, resizeDir, bounds, size, position, aspectRatio, parentRef]
		);

		useEffect(() => {
			const updateSize = () => {
				let newWidth = size.width;
				let newHeight = size.height;

				if (newWidth > width) {
					newWidth = width;
				}

				if (newHeight > height) {
					newHeight = height;
				}

				if (newWidth > width && newHeight > height) {
					newWidth = width;
					newHeight = height;
				}

				const finalWidth = Math.max(newWidth, initialWidth);
				const finalHeight = Math.max(newHeight, initialHeight);

				setSize({
					width: finalWidth,
					height: finalHeight
				});
			};
			updateSize();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [width, height]);

		const handleMouseDown = useCallback((e: React.MouseEvent) => {
			e.preventDefault();
			setIsDragging(true);
		}, []);

		const handleResizeMouseDown = useCallback((direction: string) => {
			return (e: React.MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				setResizeDir(direction);
			};
		}, []);

		const handleMouseUp = useCallback(() => {
			setIsDragging(false);
			setResizeDir(null);
		}, []);

		useEffect(() => {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);

			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}, [handleMouseMove, handleMouseUp]);
		const isContentStrict = !isCollapsed ? 'contain-strict' : '';
		return (
			<div
				onMouseDown={() => onFocus()}
				ref={modalRef}
				className={`absolute bg-transparent shadow-lg rounded-lg ${zIndex} ${isContentStrict}`}
				style={{
					left: `${position.x}px`,
					top: `${position.y}px`,
					width: !isCollapsed ? `${size.width}px` : '',
					height: isCollapsed ? '28px' : `${size.height}px`,
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				{!isCollapsed && <Overlay isFocused={isFocused} onFocus={onFocus} headerHeight={headerHeight} />}
				<ModalHeader
					onClose={onClose}
					handleMouseDown={handleMouseDown}
					title={headerTitle}
					isFocused={isFocused}
					clanId={clanId}
					channelId={channelId}
					onCollapseToggle={onCollapseToggle}
					isCollapsed={isCollapsed}
				/>
				<ModalContent isDragging={isDragging} resizeDir={resizeDir} isCollapsed={isCollapsed}>
					{children}
				</ModalContent>
				{!isCollapsed && <ResizeHandles handleResizeMouseDown={handleResizeMouseDown} />}
			</div>
		);
	}
);

export default DraggableModal;
