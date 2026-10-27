import type { CanvasSize, MeasureText, NormalizedPoint, PenStroke, ScreenDrawState, TextAnnotation } from './screenDrawState';
import { TEXT_HANDLE_SIZE, TEXT_LINE_HEIGHT, textFontPx } from './screenDrawState';

export interface ContentViewport {
	offsetX: number;
	offsetY: number;
	width: number;
	height: number;
}

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const ANNOTATION_FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SELECTION_COLOR = '#5865F2';
const MIN_FRAME_SCALE = 0.25;
const MAX_FRAME_SCALE = 8;

const annotationFont = (size: number) => `bold ${size}px ${ANNOTATION_FONT_FAMILY}`;

export const computeContentViewport = (
	containerWidth: number,
	containerHeight: number,
	contentWidth: number,
	contentHeight: number
): ContentViewport => {
	if (containerWidth <= 0 || containerHeight <= 0) {
		return { offsetX: 0, offsetY: 0, width: Math.max(containerWidth, 1), height: Math.max(containerHeight, 1) };
	}
	const contentRatio = contentWidth > 0 && contentHeight > 0 ? contentWidth / contentHeight : 16 / 9;
	const wider = containerWidth / containerHeight > contentRatio;
	const width = wider ? containerHeight * contentRatio : containerWidth;
	const height = wider ? containerHeight : containerWidth / contentRatio;
	return { offsetX: (containerWidth - width) / 2, offsetY: (containerHeight - height) / 2, width, height };
};

let measureContext: CanvasRenderingContext2D | null = null;

export const measureTextWidth: MeasureText = (text) => {
	if (!text.content) return 0;
	measureContext ??= document.createElement('canvas').getContext('2d');
	if (!measureContext) return 0;
	measureContext.font = annotationFont(textFontPx(text.fontSize));
	return measureContext.measureText(text.content).width;
};

const toPixels = (viewport: ContentViewport, point: NormalizedPoint): [number, number] => [
	viewport.offsetX + point.x * viewport.width,
	viewport.offsetY + point.y * viewport.height
];

const paintStroke = (ctx: Context2D, viewport: ContentViewport, stroke: PenStroke, scale: number) => {
	if (!stroke.points.length) return;
	const width = Math.max(stroke.width * scale, 1);
	const [firstX, firstY] = toPixels(viewport, stroke.points[0]);
	ctx.fillStyle = stroke.color;
	ctx.strokeStyle = stroke.color;
	ctx.beginPath();
	if (stroke.points.length === 1) {
		ctx.arc(firstX, firstY, width / 2, 0, Math.PI * 2);
		ctx.fill();
		return;
	}
	ctx.lineWidth = width;
	ctx.moveTo(firstX, firstY);
	for (let index = 1; index < stroke.points.length; index++) {
		const [x, y] = toPixels(viewport, stroke.points[index]);
		ctx.lineTo(x, y);
	}
	ctx.stroke();
};

const paintText = (ctx: Context2D, viewport: ContentViewport, text: TextAnnotation, scale: number) => {
	if (!text.content.trim()) return;
	const size = Math.max(textFontPx(text.fontSize) * scale, 6);
	const [x, y] = toPixels(viewport, text.position);
	ctx.font = annotationFont(size);
	ctx.fillStyle = text.color;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillText(text.content, x, y + (size * TEXT_LINE_HEIGHT) / 2);
};

const paintSelection = (ctx: Context2D, state: ScreenDrawState, viewport: ContentViewport) => {
	if (state.activeTool !== 'text' && state.activeTool !== 'pointer') return;
	const selected = state.selectedAnnotation();
	if (!selected || state.editingTextId === selected.id) return;
	const canvas: CanvasSize = [viewport.width, viewport.height];
	const frame = state.annotationBounds(selected, canvas, measureTextWidth);
	if (!frame) return;
	ctx.save();
	ctx.strokeStyle = SELECTION_COLOR;
	ctx.lineWidth = 1;
	ctx.setLineDash([4, 3]);
	ctx.strokeRect(viewport.offsetX + frame.left - 2, viewport.offsetY + frame.top - 2, frame.right - frame.left + 4, frame.bottom - frame.top + 4);
	ctx.restore();
	if (selected.kind !== 'text') return;
	const centerX = viewport.offsetX + frame.right;
	const centerY = viewport.offsetY + frame.bottom;
	ctx.fillStyle = SELECTION_COLOR;
	ctx.fillRect(centerX - TEXT_HANDLE_SIZE / 2, centerY - TEXT_HANDLE_SIZE / 2, TEXT_HANDLE_SIZE, TEXT_HANDLE_SIZE);
	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(centerX - TEXT_HANDLE_SIZE / 2 + 2, centerY - TEXT_HANDLE_SIZE / 2 + 2, TEXT_HANDLE_SIZE - 4, TEXT_HANDLE_SIZE - 4);
};

export const paintScreenDraw = (
	ctx: Context2D,
	state: ScreenDrawState,
	viewport: ContentViewport,
	options: { scale: number; hiddenTextId: number | null; selection: boolean }
) => {
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	for (const annotation of state.annotations) {
		if (annotation.kind === 'stroke') paintStroke(ctx, viewport, annotation, options.scale);
		else if (annotation.id !== options.hiddenTextId) paintText(ctx, viewport, annotation, options.scale);
	}
	if (state.currentStroke) paintStroke(ctx, viewport, state.currentStroke, options.scale);
	if (options.selection) paintSelection(ctx, state, viewport);
};

export const paintScreenDrawFrame = (ctx: Context2D, state: ScreenDrawState, width: number, height: number, canvasWidth: number) => {
	ctx.clearRect(0, 0, width, height);
	const scale = canvasWidth > 0 ? Math.min(Math.max(width / canvasWidth, MIN_FRAME_SCALE), MAX_FRAME_SCALE) : 1;
	paintScreenDraw(ctx, state, { offsetX: 0, offsetY: 0, width, height }, { scale, hiddenTextId: null, selection: false });
};
