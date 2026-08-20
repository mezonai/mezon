import { useCallback, useEffect, useRef, useState } from 'react';

interface VoiceInteractiveWindowProps {
	url: string;
	title: string;
	onClose: () => void;
}

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

const VoiceInteractiveWindow = ({ url, title, onClose }: VoiceInteractiveWindowProps) => {
	const winRef = useRef<HTMLDivElement>(null);

	const draggingRef = useRef(false);
	const resizingRef = useRef(false);

	const offsetRef = useRef({ x: 0, y: 0 });
	const resizeStartRef = useRef({
		x: 0,
		y: 0,
		width: 900,
		height: 700
	});

	const [pos, setPos] = useState({ x: 60, y: 60 });
	const [size, setSize] = useState({
		width: 900,
		height: 700
	});

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		if (e.button !== 0) return;

		draggingRef.current = true;

		const rect = winRef.current?.getBoundingClientRect();
		if (!rect) return;

		offsetRef.current = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}, []);

	const handleResizeMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button !== 0) return;

			e.stopPropagation();

			resizingRef.current = true;

			resizeStartRef.current = {
				x: e.clientX,
				y: e.clientY,
				width: size.width,
				height: size.height
			};
		},
		[size.width, size.height]
	);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (draggingRef.current) {
				const maxX = Math.max(0, window.innerWidth - size.width);
				const maxY = Math.max(0, window.innerHeight - size.height);

				const newX = Math.max(0, Math.min(e.clientX - offsetRef.current.x, maxX));

				const newY = Math.max(0, Math.min(e.clientY - offsetRef.current.y, maxY));

				setPos({
					x: newX,
					y: newY
				});
			}

			if (resizingRef.current) {
				const start = resizeStartRef.current;

				const newWidth = Math.max(MIN_WIDTH, start.width + (e.clientX - start.x));

				const newHeight = Math.max(MIN_HEIGHT, start.height + (e.clientY - start.y));

				setSize({
					width: Math.min(newWidth, window.innerWidth - pos.x),
					height: Math.min(newHeight, window.innerHeight - pos.y)
				});
			}
		};

		const handleMouseUp = () => {
			draggingRef.current = false;
			resizingRef.current = false;
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [pos.x, pos.y, size.width, size.height]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [onClose]);

	const activePopupRef = useRef<HTMLDivElement | null>(null);

	const focusPopup = useCallback((popup: HTMLDivElement) => {
		if (activePopupRef.current === popup) return;
		activePopupRef.current?.style.setProperty('z-index', '9999');
		popup.style.setProperty('z-index', '10000');

		activePopupRef.current = popup;
	}, []);

	useEffect(() => {
		const handleOutsideClick = (event: PointerEvent) => {
			const activePopup = activePopupRef.current;

			if (!activePopup) return;

			if (!activePopup.contains(event.target as Node)) {
				activePopup.style.setProperty('z-index', '9999');
				activePopupRef.current = null;
			}
		};

		document.addEventListener('pointerdown', handleOutsideClick);

		return () => {
			document.removeEventListener('pointerdown', handleOutsideClick);
		};
	}, []);

	return (
		<div
			onPointerDown={() => {
				if (winRef.current) {
					focusPopup(winRef.current);
				}
			}}
			ref={winRef}
			style={{
				position: 'fixed',
				top: pos.y,
				left: pos.x,
				width: size.width,
				height: size.height,
				zIndex: 9999
			}}
			className="flex flex-col bg-theme-setting-primary text-theme-primary rounded-lg shadow-2xl overflow-hidden border border-zinc-700"
		>
			<div onMouseDown={handleMouseDown} className="flex items-center justify-between px-3 py-2 bg-zinc-800 cursor-move select-none">
				<span className="text-sm font-medium truncate">{title}</span>

				<button onClick={onClose} aria-label="Close" className="hover:bg-zinc-700 rounded px-2 py-1 text-sm">
					✕
				</button>
			</div>

			<iframe
				key={url}
				src={url}
				title={title}
				className="flex-1 w-full border-0 bg-white"
				allow="camera; microphone; clipboard-write; fullscreen"
				sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
			/>

			<div onMouseDown={handleResizeMouseDown} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" />
		</div>
	);
};

export default VoiceInteractiveWindow;
