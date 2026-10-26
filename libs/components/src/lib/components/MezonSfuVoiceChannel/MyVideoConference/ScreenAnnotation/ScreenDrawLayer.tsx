import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import type { ScreenDrawSession } from './ScreenDrawSession';
import { ScreenDrawToolbar } from './ScreenDrawToolbar';
import type { ContentViewport } from './paintScreenDraw';
import { computeContentViewport, measureTextWidth, paintScreenDraw } from './paintScreenDraw';
import type { DrawTool } from './screenDrawState';
import { normalizedPoint } from './screenDrawState';

interface LayerLayout {
	width: number;
	height: number;
	viewport: ContentViewport;
}

const EDITOR_MAX_WIDTH = 360;

const TOOL_CURSORS: Record<DrawTool, string> = {
	pointer: 'default',
	pen: 'crosshair',
	text: 'text',
	eraser: 'crosshair'
};

const isTypingTarget = (target: EventTarget | null) =>
	target instanceof HTMLElement && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

const ScreenDrawTextEditor = ({
	color,
	value,
	left,
	top,
	onChange,
	onCommit,
	onCancel
}: {
	color: string;
	value: string;
	left: number;
	top: number;
	onChange: (value: string) => void;
	onCommit: () => void;
	onCancel: () => void;
}) => {
	const { t } = useTranslation('channelVoice');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const frame = requestAnimationFrame(() => inputRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, []);

	return (
		<div
			className="absolute z-20 flex items-center gap-2 rounded-lg border-2 bg-zinc-900/95 px-3 py-2 shadow-xl"
			style={{ left, top, borderColor: color }}
			onPointerDown={(event) => event.stopPropagation()}
			onMouseDown={(event) => event.stopPropagation()}
			onClick={(event) => event.stopPropagation()}
		>
			<input
				ref={inputRef}
				value={value}
				placeholder={t('screenDraw.textPlaceholder')}
				className="min-w-[180px] max-w-[320px] bg-transparent text-sm font-bold outline-none placeholder:text-zinc-500"
				style={{ color }}
				onChange={(event) => onChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.nativeEvent.isComposing) return;
					if (event.key === 'Enter') {
						event.preventDefault();
						onCommit();
					} else if (event.key === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
						onCancel();
					}
				}}
			/>
			<button
				type="button"
				title={t('screenDraw.commit')}
				aria-label={t('screenDraw.commit')}
				className="flex h-6 w-6 items-center justify-center rounded-md bg-[#10B981] text-xs font-bold text-white hover:opacity-85"
				onClick={onCommit}
			>
				✓
			</button>
			<button
				type="button"
				title={t('screenDraw.cancel')}
				aria-label={t('screenDraw.cancel')}
				className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EF4444] text-xs font-bold text-white hover:opacity-85"
				onClick={onCancel}
			>
				✕
			</button>
		</div>
	);
};

export const ScreenDrawLayer = ({ session, onClose }: { session: ScreenDrawSession; onClose: () => void }) => {
	useSyncExternalStore(session.subscribe, session.getVersion);
	const state = session.state;
	const hostRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [layout, setLayout] = useState<LayerLayout | null>(null);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		const video = host.parentElement?.querySelector('video') ?? null;
		const measure = () => {
			const hostRect = host.getBoundingClientRect();
			const videoRect = video?.getBoundingClientRect() ?? hostRect;
			const content = computeContentViewport(videoRect.width, videoRect.height, video?.videoWidth ?? 0, video?.videoHeight ?? 0);
			setLayout({
				width: hostRect.width,
				height: hostRect.height,
				viewport: {
					...content,
					offsetX: content.offsetX + videoRect.left - hostRect.left,
					offsetY: content.offsetY + videoRect.top - hostRect.top
				}
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(host);
		if (video) observer.observe(video);
		video?.addEventListener('resize', measure);
		video?.addEventListener('loadedmetadata', measure);
		return () => {
			observer.disconnect();
			video?.removeEventListener('resize', measure);
			video?.removeEventListener('loadedmetadata', measure);
		};
	}, []);

	useEffect(() => {
		if (layout) session.setCanvas(layout.viewport.width, layout.viewport.height);
	}, [layout, session]);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx || !layout) return;
		const ratio = window.devicePixelRatio || 1;
		const pixelWidth = Math.round(layout.width * ratio);
		const pixelHeight = Math.round(layout.height * ratio);
		if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
		if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		ctx.clearRect(0, 0, layout.width, layout.height);
		paintScreenDraw(ctx, state, layout.viewport, {
			scale: 1,
			hiddenTextId: state.isActive ? state.editingTextId : null,
			selection: state.isActive
		});
	});

	useEffect(() => {
		if (!state.isActive) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (isTypingTarget(event.target)) return;
			const key = event.key.toLowerCase();
			const secondary = event.metaKey || event.ctrlKey;
			if (secondary && key === 'z') session.edit((draw) => (event.shiftKey ? draw.redo() : draw.undo()));
			else if (event.ctrlKey && key === 'y') session.edit((draw) => draw.redo());
			else if (key === 'escape') session.edit((draw) => draw.setTool('pointer'));
			else return;
			event.preventDefault();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [session, state.isActive]);

	const toPoint = (event: ReactPointerEvent<HTMLCanvasElement>, viewport: ContentViewport) => {
		const rect = event.currentTarget.getBoundingClientRect();
		return normalizedPoint(
			(event.clientX - rect.left - viewport.offsetX) / viewport.width,
			(event.clientY - rect.top - viewport.offsetY) / viewport.height
		);
	};

	const editing = state.isActive ? state.editingText() : undefined;
	const editorPosition =
		editing && layout
			? {
					left: Math.min(
						layout.viewport.offsetX + editing.position.x * layout.viewport.width,
						Math.max(0, layout.width - EDITOR_MAX_WIDTH)
					),
					top: layout.viewport.offsetY + editing.position.y * layout.viewport.height
				}
			: null;

	return (
		<div ref={hostRef} className={`absolute inset-0 z-10 ${state.isActive ? '' : 'pointer-events-none'}`}>
			<canvas
				ref={canvasRef}
				className="absolute inset-0 h-full w-full touch-none"
				style={{ cursor: state.isActive ? TOOL_CURSORS[state.activeTool] : undefined }}
				onMouseDown={(event) => event.preventDefault()}
				onPointerDown={(event) => {
					if (!state.isActive || !layout || event.button !== 0) return;
					const { viewport } = layout;
					const point = toPoint(event, viewport);
					event.currentTarget.setPointerCapture(event.pointerId);
					session.edit((draw) => draw.pointerDown(point, [viewport.width, viewport.height], measureTextWidth));
				}}
				onPointerMove={(event) => {
					if (!state.isActive || !layout) return;
					const point = toPoint(event, layout.viewport);
					const pressed = (event.buttons & 1) === 1;
					session.edit((draw) => draw.pointerMove(point, pressed));
				}}
				onPointerUp={() => {
					if (state.isActive) session.edit((draw) => draw.pointerUp());
				}}
				onPointerCancel={() => session.edit((draw) => draw.cancelPointer())}
			/>
			{editing && editorPosition && (
				<ScreenDrawTextEditor
					key={editing.id}
					color={editing.color}
					value={state.editingTextContent}
					left={editorPosition.left}
					top={editorPosition.top}
					onChange={(value) => session.edit((draw) => draw.setEditingTextContent(value))}
					onCommit={() => session.edit((draw) => draw.commitEditingText())}
					onCancel={() => session.edit((draw) => draw.cancelEditingText())}
				/>
			)}
			{state.isActive && <ScreenDrawToolbar session={session} onClose={onClose} />}
		</div>
	);
};
