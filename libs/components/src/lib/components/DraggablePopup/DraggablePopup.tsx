import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { usePopupManager } from './PopupManager';

type InitialPosition = 'center' | 'bottom-right';

interface DraggablePopupProps {
	children: React.ReactNode;
	title?: string;
	customHeader?: React.ReactNode;
	customFooter?: React.ReactNode;
	onClose: () => void;
	onMaximizeToggle?: (isMaximized: boolean) => void;
	initialPosition?: InitialPosition;
	initialWidth?: number;
	initialHeight?: number;
	minWidth?: number;
	minHeight?: number;
	popupId?: string;
}

const DraggablePopup = forwardRef<HTMLDivElement, DraggablePopupProps>(
	(
		{
			children,
			title = 'Popup',
			customHeader,
			customFooter,
			onClose,
			onMaximizeToggle,
			initialPosition = 'bottom-right',
			initialWidth = 800,
			initialHeight = 600,
			minWidth = 400,
			minHeight = 300,
			popupId = `popup-${Date.now()}-${Math.random()}`
		},
		ref
	) => {
		const { getZIndex, bringToFront, registerPopup, unregisterPopup, isActivePopup } = usePopupManager();

		const calculateInitialPosition = () => {
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;

			if (initialPosition === 'center') {
				return {
					x: (screenWidth - initialWidth) / 2,
					y: (screenHeight - initialHeight) / 2
				};
			} else {
				// bottom-right position
				return {
					x: screenWidth - initialWidth - 15,
					y: screenHeight - initialHeight - 15
				};
			}
		};

		const [position, setPosition] = useState(calculateInitialPosition);
		const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
		const [isDragging, setIsDragging] = useState(false);
		const [isResizing, setIsResizing] = useState(false);
		const [resizeDirection, setResizeDirection] = useState('');
		const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
		const [isMaximized, setIsMaximized] = useState(false);
		const [preMaximizeState, setPreMaximizeState] = useState(() => ({
			position: calculateInitialPosition(),
			dimensions: { width: initialWidth, height: initialHeight }
		}));

		const popupRef = useRef<HTMLDivElement>(null);
		const headerRef = useRef<HTMLDivElement>(null);

		const maximizeToggle = () => {
			if (!isMaximized) {
				setPreMaximizeState({ position, dimensions });
				setPosition({ x: 0, y: 0 });
				setDimensions({
					width: window.innerWidth,
					height: window.innerHeight
				});
				setIsMaximized(true);
				onMaximizeToggle?.(true);
			} else {
				setPosition(preMaximizeState.position);
				setDimensions(preMaximizeState.dimensions);
				setIsMaximized(false);
				onMaximizeToggle?.(false);
			}
		};

		useEffect(() => {
			const handleMaximize = () => maximizeToggle();

			const popupElement = ref && 'current' in ref ? ref.current : null;
			if (popupElement) {
				(popupElement as any).maximizeToggle = handleMaximize;
			}

			return () => {
				if (popupElement) {
					delete (popupElement as any).maximizeToggle;
				}
			};
		}, [position, dimensions, isMaximized, preMaximizeState, ref]);

		useEffect(() => {
			const handleResize = () => {
				if (!isMaximized) {
					const screenWidth = window.innerWidth;
					const screenHeight = window.innerHeight;

					let newX = position.x;
					let newY = position.y;

					// If popup is beyond right edge
					if (newX + dimensions.width > screenWidth) {
						newX = screenWidth - dimensions.width - 20;
					}

					// If popup is beyond bottom edge
					if (newY + dimensions.height > screenHeight) {
						newY = screenHeight - dimensions.height - 20;
					}

					if (newX !== position.x || newY !== position.y) {
						setPosition({ x: newX, y: newY });
					}
				}
			};

			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}, [dimensions, isMaximized, position]);

		useEffect(() => {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					if (isActivePopup(popupId)) {
						event.preventDefault();
						event.stopPropagation();
						onClose();
					}
				}
			};

			document.addEventListener('keydown', handleKeyDown, true);

			return () => {
				document.removeEventListener('keydown', handleKeyDown, true);
			};
		}, [onClose, isActivePopup, popupId]);

		useEffect(() => {
			registerPopup(popupId);
			return () => {
				unregisterPopup(popupId);
			};
		}, [popupId, registerPopup, unregisterPopup]);

		const handlePopupClick = useCallback(
			(e: React.MouseEvent) => {
				bringToFront(popupId);
			},
			[bringToFront, popupId]
		);

		const handleMouseDown = (e: React.MouseEvent) => {
			e.stopPropagation();
			// Check if clicking on header or footer (draggable areas)
			const target = e.target as HTMLElement;
			const isDraggableArea = target.closest('.draggable-header') || target.closest('.draggable-footer');

			if (isDraggableArea) {
				setIsDragging(true);
				setDragStartPos({
					x: e.clientX - position.x,
					y: e.clientY - position.y
				});
			}
		};

		const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
			e.stopPropagation();
			e.preventDefault();
			setIsResizing(true);
			setResizeDirection(direction);
			setDragStartPos({
				x: e.clientX,
				y: e.clientY
			});
		};

		const handleMouseMove = (e: MouseEvent) => {
			e.stopPropagation();
			if (isDragging && !isMaximized) {
				setPosition({
					x: e.clientX - dragStartPos.x,
					y: e.clientY - dragStartPos.y
				});
			} else if (isResizing && !isMaximized) {
				e.preventDefault();

				let newWidth = dimensions.width;
				let newHeight = dimensions.height;
				let newX = position.x;
				let newY = position.y;

				if (resizeDirection.includes('e')) {
					newWidth = Math.max(e.clientX - position.x, minWidth);
				}
				if (resizeDirection.includes('s')) {
					newHeight = Math.max(e.clientY - position.y, minHeight);
				}
				if (resizeDirection.includes('w')) {
					const width = Math.max(dimensions.width + (position.x - e.clientX), minWidth);
					newX = e.clientX;
					if (width > minWidth) {
						newWidth = width;
					}
				}
				if (resizeDirection.includes('n')) {
					const height = Math.max(dimensions.height + (position.y - e.clientY), minHeight);
					newY = e.clientY;
					if (height > minHeight) {
						newHeight = height;
					}
				}

				setDimensions({ width: newWidth, height: newHeight });
				if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
					setPosition({ x: newX, y: newY });
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsResizing(false);
		};

		useEffect(() => {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}, [isDragging, isResizing, position, dimensions]);

		return (
			<div
				ref={ref}
				onClick={handlePopupClick}
				className={`contain-strict none-draggable-area fixed rounded-md shadow-lg overflow-hidden flex flex-col ${
					isMaximized ? 'bg-[#36393f]' : 'bg-[#36393f]'
				}`}
				style={{
					width: `${dimensions.width}px`,
					height: `${dimensions.height}px`,
					left: `${position.x}px`,
					top: `${position.y}px`,
					zIndex: getZIndex(popupId)
				}}
			>
				{customHeader ? (
					<div onMouseDown={handleMouseDown} className="cursor-move draggable-header">
						{customHeader}
					</div>
				) : (
					<div
						onMouseDown={handleMouseDown}
						className="bg-[#202225] text-white px-4 py-2 cursor-move flex justify-between items-center draggable-header"
					>
						<div className="font-medium">{title}</div>
						<div className="flex space-x-2">
							{/* <button onClick={maximizeToggle} className="focus:outline-none text-gray-400 hover:text-white">
							{isMaximized ? <Icons.ExitFullScreen className="w-4 h-4" /> : <Icons.FullScreen className="w-4 h-4" />}
						</button>
						<button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-[#da373c]">
							✕
						</button> */}
						</div>
					</div>
				)}

				<div className="flex-1 overflow-auto popup-content">{children}</div>

				{customFooter && (
					<div onMouseDown={handleMouseDown} className="cursor-move draggable-footer">
						{customFooter}
					</div>
				)}

				{!isMaximized && (
					<>
						<div className="absolute bottom-0 right-0 w-12 h-12 cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
						<div className="absolute bottom-0 left-0 w-12 h-12 cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
						<div className="absolute top-0 right-0 w-[20px] h-12 cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
						<div className="absolute top-0 left-0 w-12 h-12 cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
					</>
				)}
			</div>
		);
	}
);

DraggablePopup.displayName = 'DraggablePopup';

export default DraggablePopup;
