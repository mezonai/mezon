import type { ComponentType, PointerEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ScreenDrawSession } from './ScreenDrawSession';
import {
	ScreenDrawCloseIcon,
	ScreenDrawEraserIcon,
	ScreenDrawGripIcon,
	ScreenDrawPenIcon,
	ScreenDrawPointerIcon,
	ScreenDrawRedoIcon,
	ScreenDrawTextIcon,
	ScreenDrawTrashIcon,
	ScreenDrawUndoIcon
} from './screenDrawIcons';
import type { DrawTool } from './screenDrawState';
import { PRESET_COLORS, PRESET_WIDTHS } from './screenDrawState';

const TOOLS: { tool: DrawTool; labelKey: string; Icon: ComponentType<{ className?: string }> }[] = [
	{ tool: 'pointer', labelKey: 'screenDraw.selectAndMove', Icon: ScreenDrawPointerIcon },
	{ tool: 'pen', labelKey: 'screenDraw.pen', Icon: ScreenDrawPenIcon },
	{ tool: 'text', labelKey: 'screenDraw.text', Icon: ScreenDrawTextIcon },
	{ tool: 'eraser', labelKey: 'screenDraw.eraser', Icon: ScreenDrawEraserIcon }
];

const WIDTH_DOT_SIZES = [4, 7, 10];

interface ToolbarPosition {
	left: number;
	top: number;
	width: number;
	height: number;
}

interface ToolbarDrag {
	pointerId: number;
	startX: number;
	startY: number;
	origin: ToolbarPosition;
	maxLeft: number;
	maxTop: number;
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));

const Divider = () => <div className="mx-1 h-6 w-px bg-white/15" />;

const ToolbarButton = ({
	label,
	selected = false,
	disabled = false,
	onClick,
	children
}: {
	label: string;
	selected?: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: ReactNode;
}) => (
	<button
		type="button"
		title={label}
		aria-label={label}
		aria-pressed={selected}
		disabled={disabled}
		className={`flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors disabled:cursor-default disabled:opacity-35 ${
			selected ? 'bg-[#5865F2]' : 'hover:bg-white/15'
		}`}
		onClick={onClick}
	>
		{children}
	</button>
);

export const ScreenDrawToolbar = ({ session, onClose }: { session: ScreenDrawSession; onClose: () => void }) => {
	const { t } = useTranslation('channelVoice');
	const state = session.state;
	const widthEnabled = state.activeTool === 'pen';
	const toolbarRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<ToolbarDrag | null>(null);
	const [position, setPosition] = useState<ToolbarPosition | null>(null);
	const [dragging, setDragging] = useState(false);

	const startDrag = (event: PointerEvent<HTMLDivElement>) => {
		event.stopPropagation();
		const toolbar = toolbarRef.current;
		const parent = toolbar?.offsetParent;
		if (event.button !== 0 || !toolbar || !(parent instanceof HTMLElement)) return;
		if (event.target instanceof Element && event.target.closest('button')) return;
		const rect = toolbar.getBoundingClientRect();
		const parentRect = parent.getBoundingClientRect();
		dragRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			origin: { left: rect.left - parentRect.left, top: rect.top - parentRect.top, width: rect.width, height: rect.height },
			maxLeft: parentRect.width - rect.width,
			maxTop: parentRect.height - rect.height
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		event.preventDefault();
		setDragging(true);
	};

	const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		setPosition({
			...drag.origin,
			left: clamp(drag.origin.left + event.clientX - drag.startX, drag.maxLeft),
			top: clamp(drag.origin.top + event.clientY - drag.startY, drag.maxTop)
		});
	};

	const endDrag = (event: PointerEvent<HTMLDivElement>) => {
		if (dragRef.current?.pointerId !== event.pointerId) return;
		dragRef.current = null;
		setDragging(false);
	};

	return (
		<div
			ref={toolbarRef}
			className={`absolute z-20 flex max-w-[calc(100%-16px)] items-center gap-1 overflow-x-auto rounded-xl border border-white/15 bg-zinc-900/95 px-2 py-1.5 shadow-xl ${
				position ? '' : 'left-1/2 top-4 -translate-x-1/2'
			} ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
			style={
				position
					? {
							left: `clamp(0px, ${position.left}px, calc(100% - ${position.width}px))`,
							top: `clamp(0px, ${position.top}px, calc(100% - ${position.height}px))`
						}
					: undefined
			}
			onPointerDown={startDrag}
			onPointerMove={moveDrag}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onMouseDown={(event) => event.stopPropagation()}
			onClick={(event) => event.stopPropagation()}
		>
			<div className="flex h-8 w-5 shrink-0 items-center justify-center text-zinc-400">
				<ScreenDrawGripIcon className="h-5 w-5" />
			</div>
			{TOOLS.map(({ tool, labelKey, Icon }) => (
				<ToolbarButton
					key={tool}
					label={t(labelKey)}
					selected={state.activeTool === tool}
					onClick={() => session.edit((draw) => draw.setTool(tool))}
				>
					<Icon className="h-5 w-5" />
				</ToolbarButton>
			))}
			<Divider />
			<div className="flex items-center gap-1">
				{PRESET_COLORS.map((color) => (
					<button
						key={color}
						type="button"
						aria-label={color}
						aria-pressed={state.strokeColor === color}
						className={`h-[18px] w-[18px] shrink-0 rounded-full hover:opacity-85 ${
							state.strokeColor === color ? 'border-2 border-white shadow-sm' : 'border border-white/25'
						}`}
						style={{ backgroundColor: color }}
						onClick={() => session.edit((draw) => draw.setColor(color))}
					/>
				))}
			</div>
			<Divider />
			<div className={`flex items-center gap-0.5 ${widthEnabled ? '' : 'opacity-35'}`}>
				{PRESET_WIDTHS.map((width, index) => (
					<button
						key={width}
						type="button"
						aria-label={`${width}px`}
						aria-pressed={Math.abs(state.strokeWidth - width) < 0.5}
						disabled={!widthEnabled}
						className={`flex h-6 w-6 items-center justify-center rounded-md ${
							Math.abs(state.strokeWidth - width) < 0.5 ? 'bg-white/20' : widthEnabled ? 'hover:bg-white/15' : ''
						}`}
						onClick={() => session.edit((draw) => draw.setWidth(width))}
					>
						<span
							className="rounded-full"
							style={{ width: WIDTH_DOT_SIZES[index], height: WIDTH_DOT_SIZES[index], backgroundColor: state.strokeColor }}
						/>
					</button>
				))}
			</div>
			<Divider />
			<ToolbarButton label={t('screenDraw.undo')} disabled={!state.canUndo()} onClick={() => session.edit((draw) => draw.undo())}>
				<ScreenDrawUndoIcon className="h-5 w-5" />
			</ToolbarButton>
			<ToolbarButton label={t('screenDraw.redo')} disabled={!state.canRedo()} onClick={() => session.edit((draw) => draw.redo())}>
				<ScreenDrawRedoIcon className="h-5 w-5" />
			</ToolbarButton>
			<ToolbarButton label={t('screenDraw.clear')} disabled={!state.hasContent()} onClick={() => session.edit((draw) => draw.clear())}>
				<ScreenDrawTrashIcon className="h-5 w-5" />
			</ToolbarButton>
			<Divider />
			<button
				type="button"
				title={t(session.broadcast ? 'screenDraw.stopAnnotating' : 'screenDraw.closeDrawing')}
				aria-label={t(session.broadcast ? 'screenDraw.stopAnnotating' : 'screenDraw.closeDrawing')}
				className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EF4444] text-white hover:opacity-85"
				onClick={onClose}
			>
				<ScreenDrawCloseIcon className="h-4 w-4" />
			</button>
		</div>
	);
};
