import React, { useEffect, useRef, useState } from 'react';

interface DraggablePopupProps {
	children: React.ReactNode;
	title?: string;
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	initialHeight?: number;
	minWidth?: number;
	minHeight?: number;
}

const DraggablePopup: React.FC<DraggablePopupProps> = ({
	children,
	title = 'Popup',
	isOpen,
	onClose,
	initialWidth = 800,
	initialHeight = 600,
	minWidth = 400,
	minHeight = 300
}) => {
	const calculateInitialPosition = () => {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		return {
			x: screenWidth - initialWidth - 15,
			y: screenHeight - initialHeight - 15
		};
	};

	const [position, setPosition] = useState(calculateInitialPosition);
	const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [resizeDirection, setResizeDirection] = useState('');
	const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
	const [isMaximized, setIsMaximized] = useState(false);
	const [preMaximizeState, setPreMaximizeState] = useState({
		position: calculateInitialPosition(),
		dimensions: { width: initialWidth, height: initialHeight }
	});

	const popupRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);

	// const maximizeToggle = () => {
	// 	if (!isMaximized) {
	// 		setPreMaximizeState({ position, dimensions });
	// 		setPosition({ x: 0, y: 0 });
	// 		setDimensions({
	// 			width: window.innerWidth,
	// 			height: window.innerHeight
	// 		});
	// 		setIsMaximized(true);
	// 	} else {
	// 		setPosition(preMaximizeState.position);
	// 		setDimensions(preMaximizeState.dimensions);
	// 		setIsMaximized(false);
	// 	}
	// };

	// Handle window resize to prevent popup from going outside viewport
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

	const handleMouseDown = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (headerRef.current && headerRef.current.contains(e.target as Node)) {
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
			ref={popupRef}
			className="fixed z-50 bg-[#36393f] rounded-md shadow-lg overflow-hidden"
			style={{
				width: `${dimensions.width}px`,
				height: `${dimensions.height}px`,
				left: `${position.x}px`,
				top: `${position.y}px`
			}}
		>
			<div
				ref={headerRef}
				onMouseDown={handleMouseDown}
				className="bg-[#202225] text-white px-4 py-2 cursor-move flex justify-between items-center"
			>
				<div className="font-medium"></div>
				<div className="flex space-x-2">
					{/* <button onClick={maximizeToggle} className="focus:outline-none text-gray-400 hover:text-white">
						{isMaximized ? <Icons.ExitFullScreen className="w-4 h-4" /> : <Icons.FullScreen className="w-4 h-4" />}
					</button>
					<button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-[#da373c]">
						✕
					</button> */}
				</div>
			</div>

			<div className="h-[calc(100%-36px)] overflow-auto">{children}</div>

			{!isMaximized && (
				<>
					<div className="absolute bottom-0 right-0 w-12 h-12 cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
					<div className="absolute bottom-0 left-0 w-12 h-12 cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
					<div className="absolute top-0 right-0 w-12 h-12 cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
					<div className="absolute top-0 left-0 w-12 h-12 cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
				</>
			)}
		</div>
	);
};

export default DraggablePopup;
