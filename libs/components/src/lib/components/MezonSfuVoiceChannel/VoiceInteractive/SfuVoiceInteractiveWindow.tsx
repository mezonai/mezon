import { useCallback, useEffect, useRef, useState } from 'react';

interface SfuVoiceInteractiveWindowProps {
	url: string;
	title: string;
	zIndex: number;
	onFocus: () => void;
	onClose: () => void;
}

const MIN_WIDTH = 360;
const MIN_HEIGHT = 260;

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const SfuVoiceInteractiveWindow = ({ url, title, zIndex, onFocus, onClose }: SfuVoiceInteractiveWindowProps) => {
	const winRef = useRef<HTMLDivElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const onFocusRef = useRef(onFocus);
	onFocusRef.current = onFocus;

	useEffect(() => {
		let lastActive: Element | null = null;

		const checkFocus = () => {
			const active = document.activeElement;
			if (active === lastActive) return;

			lastActive = active;
			if (active === iframeRef.current) {
				onFocusRef.current();
			}
		};

		const intervalId = window.setInterval(checkFocus, 150);
		return () => window.clearInterval(intervalId);
	}, []);

	const draggingRef = useRef(false);
	const resizingRef = useRef<ResizeDir | null>(null);
	const rafRef = useRef<number | null>(null);

	const offsetRef = useRef({ x: 0, y: 0 });
	const resizeStartRef = useRef<{ pointerX: number; pointerY: number; rect: Rect }>({
		pointerX: 0,
		pointerY: 0,
		rect: { x: 60, y: 60, width: 900, height: 700 }
	});

	const rectRef = useRef<Rect>({ x: 60, y: 60, width: 900, height: 700 });
	const preMaximizeRectRef = useRef<Rect | null>(null);

	const [rect, setRect] = useState<Rect>(rectRef.current);
	const [isMaximized, setIsMaximized] = useState(false);

	const scheduleUpdate = useCallback(() => {
		if (rafRef.current !== null) return;
		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			setRect({ ...rectRef.current });
		});
	}, []);

	const setInteractive = (active: boolean) => {
		if (iframeRef.current) {
			iframeRef.current.style.pointerEvents = active ? 'none' : 'auto';
		}
	};

	const handlePointerDownDrag = useCallback(
		(e: React.PointerEvent) => {
			if (e.button !== 0 || isMaximized) return;
			draggingRef.current = true;
			setInteractive(true);
			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			const r = winRef.current?.getBoundingClientRect();
			if (!r) return;
			offsetRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
		},
		[isMaximized]
	);

	const handlePointerDownResize = useCallback(
		(dir: ResizeDir) => (e: React.PointerEvent) => {
			if (e.button !== 0 || isMaximized) return;
			e.stopPropagation();
			resizingRef.current = dir;
			setInteractive(true);
			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			resizeStartRef.current = {
				pointerX: e.clientX,
				pointerY: e.clientY,
				rect: { ...rectRef.current }
			};
		},
		[isMaximized]
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (draggingRef.current) {
				const maxX = Math.max(0, window.innerWidth - rectRef.current.width);
				const maxY = Math.max(0, window.innerHeight - rectRef.current.height);

				rectRef.current = {
					...rectRef.current,
					x: Math.max(0, Math.min(e.clientX - offsetRef.current.x, maxX)),
					y: Math.max(0, Math.min(e.clientY - offsetRef.current.y, maxY))
				};
				scheduleUpdate();
				return;
			}

			const dir = resizingRef.current;
			if (dir) {
				const start = resizeStartRef.current;
				const dx = e.clientX - start.pointerX;
				const dy = e.clientY - start.pointerY;

				let { x, y, width, height } = start.rect;

				if (dir.includes('e')) {
					width = Math.max(MIN_WIDTH, start.rect.width + dx);
					width = Math.min(width, window.innerWidth - x);
				}
				if (dir.includes('s')) {
					height = Math.max(MIN_HEIGHT, start.rect.height + dy);
					height = Math.min(height, window.innerHeight - y);
				}
				if (dir.includes('w')) {
					const rawWidth = start.rect.width - dx;
					width = Math.max(MIN_WIDTH, rawWidth);
					x = start.rect.x + (start.rect.width - width);
					x = Math.max(0, x);
				}
				if (dir.includes('n')) {
					const rawHeight = start.rect.height - dy;
					height = Math.max(MIN_HEIGHT, rawHeight);
					y = start.rect.y + (start.rect.height - height);
					y = Math.max(0, y);
				}

				rectRef.current = { x, y, width, height };
				scheduleUpdate();
			}
		},
		[scheduleUpdate]
	);

	const stopInteraction = useCallback((e: React.PointerEvent) => {
		if (!draggingRef.current && !resizingRef.current) return;
		draggingRef.current = false;
		resizingRef.current = null;
		setInteractive(false);
		if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
			(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		}
	}, []);

	useEffect(() => {
		const handleWindowPointerUp = () => {
			if (draggingRef.current || resizingRef.current) {
				draggingRef.current = false;
				resizingRef.current = null;
				setInteractive(false);
			}
		};
		window.addEventListener('pointerup', handleWindowPointerUp);
		window.addEventListener('pointercancel', handleWindowPointerUp);
		return () => {
			window.removeEventListener('pointerup', handleWindowPointerUp);
			window.removeEventListener('pointercancel', handleWindowPointerUp);
		};
	}, []);

	const toggleMaximize = useCallback(() => {
		if (isMaximized) {
			const prev = preMaximizeRectRef.current;
			if (prev) {
				rectRef.current = prev;
				setRect(prev);
			}
			setIsMaximized(false);
		} else {
			preMaximizeRectRef.current = { ...rectRef.current };
			const full = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
			rectRef.current = full;
			setRect(full);
			setIsMaximized(true);
		}
	}, [isMaximized]);

	const handleTitleDoubleClick = useCallback(() => {
		toggleMaximize();
	}, [toggleMaximize]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	useEffect(() => {
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	const resizeHandles: { dir: ResizeDir; className: string }[] = [
		{ dir: 'n', className: 'top-0 left-2 right-2 h-1.5 cursor-n-resize' },
		{ dir: 's', className: 'bottom-0 left-2 right-2 h-1.5 cursor-s-resize' },
		{ dir: 'w', className: 'left-0 top-2 bottom-2 w-1.5 cursor-w-resize' },
		{ dir: 'e', className: 'right-0 top-2 bottom-2 w-1.5 cursor-e-resize' },
		{ dir: 'nw', className: 'top-0 left-0 w-3 h-3 cursor-nw-resize' },
		{ dir: 'ne', className: 'top-0 right-0 w-3 h-3 cursor-ne-resize' },
		{ dir: 'sw', className: 'bottom-0 left-0 w-3 h-3 cursor-sw-resize' },
		{ dir: 'se', className: 'bottom-0 right-0 w-3 h-3 cursor-se-resize' }
	];

	return (
		<div
			ref={winRef}
			onPointerDown={onFocus}
			onPointerMove={handlePointerMove}
			onPointerUp={stopInteraction}
			style={{
				position: 'fixed',
				top: rect.y,
				left: rect.x,
				width: rect.width,
				height: rect.height,
				zIndex
			}}
			className="flex flex-col bg-theme-setting-primary text-theme-primary shadow-2xl overflow-hidden border border-zinc-700 rounded-lg"
		>
			<div
				onPointerDown={handlePointerDownDrag}
				onDoubleClick={handleTitleDoubleClick}
				className="flex items-center justify-between h-8 px-2.5 bg-zinc-800/90 cursor-move select-none touch-none shrink-0"
			>
				<span className="text-xs font-medium truncate text-zinc-200">{title}</span>

				<div className="flex items-center gap-1">
					<button
						onClick={toggleMaximize}
						aria-label={isMaximized ? 'Restore' : 'Maximize'}
						className="flex items-center justify-center w-5 h-5 rounded hover:bg-zinc-600/70 text-zinc-300 hover:text-white"
					>
						{isMaximized ? (
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
								<rect x="1.5" y="3.5" width="5" height="5" stroke="currentColor" strokeWidth="1" />
								<path d="M3.5 3.5V1.5H8.5V6.5H6.5" stroke="currentColor" strokeWidth="1" fill="none" />
							</svg>
						) : (
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
								<rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1" />
							</svg>
						)}
					</button>

					<button
						onClick={onClose}
						aria-label="Close"
						className="flex items-center justify-center w-5 h-5 rounded hover:bg-red-600/70 text-zinc-300 hover:text-white text-xs leading-none"
					>
						✕
					</button>
				</div>
			</div>

			<iframe
				ref={iframeRef}
				key={url}
				src={url}
				title={title}
				onPointerDown={onFocus}
				className="flex-1 w-full border-0 bg-white"
				allow="camera; microphone; clipboard-write; fullscreen"
				sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
			/>

			{!isMaximized &&
				resizeHandles.map(({ dir, className }) => (
					<div key={dir} onPointerDown={handlePointerDownResize(dir)} className={`absolute touch-none ${className}`} />
				))}
		</div>
	);
};
