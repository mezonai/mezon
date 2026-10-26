export type DrawTool = 'pointer' | 'pen' | 'text' | 'eraser';

export interface NormalizedPoint {
	x: number;
	y: number;
}

export interface PenStroke {
	kind: 'stroke';
	id: number;
	color: string;
	width: number;
	points: NormalizedPoint[];
}

export interface TextAnnotation {
	kind: 'text';
	id: number;
	color: string;
	fontSize: number;
	position: NormalizedPoint;
	content: string;
}

type DrawAnnotation = PenStroke | TextAnnotation;

export type CanvasSize = [number, number];

export type MeasureText = (text: TextAnnotation) => number;

interface HitBox {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

interface AnnotationDrag {
	id: number;
	start: NormalizedPoint;
	last: NormalizedPoint;
	moved: boolean;
	editOnClick: boolean;
}

interface TextResize {
	id: number;
	origin: [number, number];
	startDistance: number;
	startSize: number;
	canvas: CanvasSize;
	resized: boolean;
}

export const PRESET_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#FFFFFF', '#18181B'];
const STROKE_WIDTH_THIN = 2;
const STROKE_WIDTH_MEDIUM = 4;
const STROKE_WIDTH_THICK = 8;
export const PRESET_WIDTHS = [STROKE_WIDTH_THIN, STROKE_WIDTH_MEDIUM, STROKE_WIDTH_THICK];

const TEXT_MIN_SIZE = 10;
const TEXT_MAX_SIZE = 120;
export const TEXT_LINE_HEIGHT = 1.3;
const TEXT_PAD_X = 8;
const TEXT_PAD_Y = 4;
export const TEXT_HANDLE_SIZE = 10;

const ERASER_RADIUS = 0.02;
const MIN_POINT_SPACING_SQUARED = 0.000002;
const TEXT_DEFAULT_SIZE = 16;
const TEXT_DRAG_THRESHOLD = 0.004;
const STROKE_HIT_SLOP = 6;
const UNDO_LIMIT = 50;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const normalizedPoint = (x: number, y: number): NormalizedPoint => ({ x: clamp(x, 0, 1), y: clamp(y, 0, 1) });

const distanceSquared = (a: NormalizedPoint, b: NormalizedPoint) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const textFontPx = (fontSize: number) => clamp(fontSize, TEXT_MIN_SIZE, TEXT_MAX_SIZE);

const textHitBox = (text: TextAnnotation, canvas: CanvasSize, textWidth: number): HitBox => {
	const size = textFontPx(text.fontSize);
	const x = text.position.x * canvas[0];
	const y = text.position.y * canvas[1];
	const width = Math.max(textWidth, size * 2);
	return {
		left: x - TEXT_PAD_X / 2,
		top: y - TEXT_PAD_Y / 2,
		right: x + width + TEXT_PAD_X / 2,
		bottom: y + size * TEXT_LINE_HEIGHT + TEXT_PAD_Y / 2
	};
};

const pointsHitBox = (points: NormalizedPoint[], canvas: CanvasSize, pad: number): HitBox | null => {
	if (!points.length) return null;
	const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
	for (const point of points) {
		const x = point.x * canvas[0];
		const y = point.y * canvas[1];
		box.left = Math.min(box.left, x);
		box.top = Math.min(box.top, y);
		box.right = Math.max(box.right, x);
		box.bottom = Math.max(box.bottom, y);
	}
	return { left: box.left - pad, top: box.top - pad, right: box.right + pad, bottom: box.bottom + pad };
};

const hitBoxContains = (box: HitBox, x: number, y: number) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;

const handleContains = (box: HitBox, x: number, y: number) =>
	Math.abs(x - box.right) <= TEXT_HANDLE_SIZE && Math.abs(y - box.bottom) <= TEXT_HANDLE_SIZE;

const pointToSegmentDistanceSquared = (p: NormalizedPoint, a: NormalizedPoint, b: NormalizedPoint) => {
	const vx = b.x - a.x;
	const vy = b.y - a.y;
	const lengthSquared = vx * vx + vy * vy;
	if (lengthSquared === 0) return distanceSquared(p, a);
	const t = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / lengthSquared, 0, 1);
	return (p.x - (a.x + t * vx)) ** 2 + (p.y - (a.y + t * vy)) ** 2;
};

const strokeIntersectsPoint = (points: NormalizedPoint[], point: NormalizedPoint, radius: number) => {
	const radiusSquared = radius * radius;
	if (points.length === 1) return distanceSquared(points[0], point) <= radiusSquared;
	for (let index = 1; index < points.length; index++) {
		if (pointToSegmentDistanceSquared(point, points[index - 1], points[index]) <= radiusSquared) return true;
	}
	return false;
};

const textIntersectsPoint = (text: TextAnnotation, point: NormalizedPoint, radius: number) => {
	const approxWidth = clamp(text.content.length * 0.012, 0.02, 0.4);
	const approxHeight = clamp(text.fontSize / 600, 0.02, 0.08);
	return (
		point.x >= text.position.x - radius &&
		point.x <= text.position.x + approxWidth + radius &&
		point.y >= text.position.y - radius &&
		point.y <= text.position.y + approxHeight + radius
	);
};

const sameAnnotations = (a: DrawAnnotation[] | undefined, b: DrawAnnotation[]) =>
	!!a && a.length === b.length && a.every((annotation, index) => annotation === b[index]);

export class ScreenDrawState {
	isActive = false;
	activeTool: DrawTool = 'pen';
	strokeColor = PRESET_COLORS[0];
	strokeWidth = STROKE_WIDTH_MEDIUM;
	textFontSize = TEXT_DEFAULT_SIZE;
	annotations: DrawAnnotation[] = [];
	currentStroke: PenStroke | null = null;
	selected: number | null = null;
	editingTextId: number | null = null;
	editingTextContent = '';
	private undoStack: DrawAnnotation[][] = [];
	private redoStack: DrawAnnotation[][] = [];
	private drag: AnnotationDrag | null = null;
	private textResize: TextResize | null = null;
	private nextId = 1;

	setActive(active: boolean) {
		this.isActive = active;
		if (active) return;
		this.currentStroke = null;
		this.drag = null;
		this.textResize = null;
		this.selected = null;
		this.editingTextId = null;
	}

	setTool(tool: DrawTool) {
		if (tool !== 'text' && this.editingTextId !== null) this.commitEditingText();
		this.activeTool = tool;
		this.currentStroke = null;
		this.drag = null;
		this.textResize = null;
		if (tool !== 'text' && tool !== 'pointer') this.selected = null;
	}

	setColor(color: string) {
		this.strokeColor = color;
	}

	setWidth(width: number) {
		this.strokeWidth = clamp(width, 1, 32);
	}

	canUndo() {
		return this.undoStack.length > 0;
	}

	canRedo() {
		return this.redoStack.length > 0;
	}

	hasContent() {
		return this.annotations.length > 0 || this.currentStroke !== null;
	}

	pointerDown(point: NormalizedPoint, canvas: CanvasSize, measure: MeasureText) {
		if (this.activeTool !== 'text' && this.editingTextId !== null) this.commitEditingText();
		switch (this.activeTool) {
			case 'pointer': {
				const resize = this.resizeHandleAt(point, canvas, measure);
				const existing = resize ? null : this.annotationAt(point, canvas, measure);
				if (resize) this.textResize = resize;
				else if (existing !== null) this.startDrag(existing, point);
				else this.selected = null;
				return;
			}
			case 'pen':
				this.currentStroke = {
					kind: 'stroke',
					id: this.takeId(),
					color: this.strokeColor,
					width: this.strokeWidth,
					points: [point]
				};
				return;
			case 'eraser':
				this.eraseAt(point);
				return;
			case 'text': {
				const resize = this.resizeHandleAt(point, canvas, measure);
				if (resize) {
					this.commitEditingText();
					this.textResize = resize;
					return;
				}
				const existing = this.textAt(point, canvas, measure);
				if (existing !== null) {
					if (this.editingTextId !== existing) {
						this.commitEditingText();
						this.startDrag(existing, point);
					}
					return;
				}
				this.commitEditingText();
				this.selected = null;
				this.startEditingText(this.addText(point));
			}
		}
	}

	pointerMove(point: NormalizedPoint, pressed: boolean) {
		if (this.textResize) return this.resizeText(this.textResize, point);
		if (this.drag) return this.dragAnnotation(this.drag, point);
		if (this.activeTool === 'pen' && this.currentStroke) return this.addStrokePoint(this.currentStroke, point);
		if (this.activeTool === 'eraser' && pressed) return this.eraseAt(point);
		return false;
	}

	pointerUp() {
		if (this.textResize) {
			this.textResize = null;
			return;
		}
		const drag = this.drag;
		if (drag) {
			this.drag = null;
			if (!drag.moved && drag.editOnClick && this.activeTool === 'text') this.startEditingText(drag.id);
			return;
		}
		const stroke = this.currentStroke;
		if (stroke) {
			this.currentStroke = null;
			this.pushUndo();
			this.annotations = [...this.annotations, stroke];
		}
	}

	cancelPointer() {
		this.currentStroke = null;
		this.drag = null;
		this.textResize = null;
	}

	selectedAnnotation() {
		return this.selected === null ? undefined : this.annotations.find((annotation) => annotation.id === this.selected);
	}

	editingText() {
		return this.editingTextId === null ? undefined : this.findText(this.editingTextId);
	}

	annotationBounds(annotation: DrawAnnotation, canvas: CanvasSize, measure: MeasureText) {
		if (annotation.kind === 'text') return textHitBox(annotation, canvas, measure(annotation));
		return pointsHitBox(annotation.points, canvas, annotation.width / 2);
	}

	undo() {
		const previous = this.undoStack.pop();
		if (!previous) return;
		this.resetEditing();
		this.redoStack.push(this.annotations);
		this.annotations = previous;
	}

	redo() {
		const next = this.redoStack.pop();
		if (!next) return;
		this.resetEditing();
		this.undoStack.push(this.annotations);
		this.annotations = next;
	}

	clear() {
		this.currentStroke = null;
		this.drag = null;
		this.textResize = null;
		this.selected = null;
		this.editingTextId = null;
		this.editingTextContent = '';
		if (!this.annotations.length) return;
		this.pushUndo();
		this.annotations = [];
	}

	setEditingTextContent(content: string) {
		if (this.editingTextId === null) return;
		const singleLine = content.replace(/[\r\n]/g, ' ');
		this.updateText(this.editingTextId, { content: singleLine });
		this.editingTextContent = singleLine;
	}

	commitEditingText() {
		const id = this.editingTextId;
		if (id === null) return;
		this.editingTextId = null;
		if (!this.editingTextContent.trim()) {
			this.discardText(id);
		} else {
			this.updateText(id, { content: this.editingTextContent });
			this.selected = id;
		}
		this.editingTextContent = '';
	}

	cancelEditingText() {
		const id = this.editingTextId;
		if (id === null) return;
		this.editingTextId = null;
		if (!this.findText(id)?.content.trim()) this.discardText(id);
		this.editingTextContent = '';
	}

	private resetEditing() {
		this.editingTextId = null;
		this.drag = null;
		this.textResize = null;
	}

	private pushUndo() {
		this.undoStack.push(this.annotations);
		this.redoStack = [];
		if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
	}

	private takeId() {
		return this.nextId++;
	}

	private findText(id: number) {
		return this.annotations.find((annotation): annotation is TextAnnotation => annotation.kind === 'text' && annotation.id === id);
	}

	private updateText(id: number, changes: Partial<Pick<TextAnnotation, 'content' | 'fontSize' | 'position'>>) {
		this.annotations = this.annotations.map((annotation) =>
			annotation.kind === 'text' && annotation.id === id ? { ...annotation, ...changes } : annotation
		);
	}

	private addText(position: NormalizedPoint) {
		this.pushUndo();
		const id = this.takeId();
		this.annotations = [...this.annotations, { kind: 'text', id, color: this.strokeColor, fontSize: this.textFontSize, position, content: '' }];
		return id;
	}

	private startEditingText(id: number) {
		const text = this.findText(id);
		if (!text) return;
		this.editingTextContent = text.content;
		this.editingTextId = id;
	}

	private discardText(id: number) {
		this.annotations = this.annotations.filter((annotation) => annotation.id !== id);
		if (sameAnnotations(this.undoStack[this.undoStack.length - 1], this.annotations)) this.undoStack.pop();
	}

	private addStrokePoint(stroke: PenStroke, point: NormalizedPoint) {
		const last = stroke.points[stroke.points.length - 1];
		if (last && distanceSquared(last, point) < MIN_POINT_SPACING_SQUARED) return false;
		stroke.points.push(point);
		return true;
	}

	private eraseAt(point: NormalizedPoint) {
		const hit = (annotation: DrawAnnotation) =>
			annotation.kind === 'stroke'
				? strokeIntersectsPoint(annotation.points, point, ERASER_RADIUS + Math.max(annotation.width / 1000, 0.005))
				: textIntersectsPoint(annotation, point, ERASER_RADIUS + Math.max(annotation.fontSize / 1000, 0.015));
		if (!this.annotations.some(hit)) return false;
		this.pushUndo();
		this.annotations = this.annotations.filter((annotation) => !hit(annotation));
		return true;
	}

	private startDrag(id: number, point: NormalizedPoint) {
		const wasSelected = this.selected === id;
		this.selected = id;
		this.drag = { id, start: point, last: point, moved: false, editOnClick: wasSelected };
	}

	private dragAnnotation(drag: AnnotationDrag, point: NormalizedPoint) {
		if (!drag.moved && Math.sqrt(distanceSquared(drag.start, point)) < TEXT_DRAG_THRESHOLD) return false;
		if (!drag.moved) this.pushUndo();
		this.drag = { ...drag, moved: true, last: point };
		const dx = point.x - drag.last.x;
		const dy = point.y - drag.last.y;
		this.annotations = this.annotations.map((annotation) => {
			if (annotation.id !== drag.id) return annotation;
			if (annotation.kind === 'text') {
				return { ...annotation, position: normalizedPoint(annotation.position.x + dx, annotation.position.y + dy) };
			}
			return { ...annotation, points: annotation.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
		});
		return true;
	}

	private resizeHandleAt(point: NormalizedPoint, canvas: CanvasSize, measure: MeasureText): TextResize | null {
		const text = this.selected === null ? undefined : this.findText(this.selected);
		if (!text || this.editingTextId === text.id) return null;
		const x = point.x * canvas[0];
		const y = point.y * canvas[1];
		if (!handleContains(textHitBox(text, canvas, measure(text)), x, y)) return null;
		const origin: [number, number] = [text.position.x * canvas[0], text.position.y * canvas[1]];
		return {
			id: text.id,
			origin,
			startDistance: Math.max(Math.hypot(x - origin[0], y - origin[1]), 1),
			startSize: textFontPx(text.fontSize),
			canvas,
			resized: false
		};
	}

	private resizeText(resize: TextResize, point: NormalizedPoint) {
		const distance = Math.hypot(point.x * resize.canvas[0] - resize.origin[0], point.y * resize.canvas[1] - resize.origin[1]);
		if (!resize.resized) this.pushUndo();
		this.textResize = { ...resize, resized: true };
		this.updateText(resize.id, { fontSize: textFontPx((resize.startSize * distance) / resize.startDistance) });
		return true;
	}

	private textAt(point: NormalizedPoint, canvas: CanvasSize, measure: MeasureText) {
		const x = point.x * canvas[0];
		const y = point.y * canvas[1];
		for (let index = this.annotations.length - 1; index >= 0; index--) {
			const annotation = this.annotations[index];
			if (annotation.kind === 'text' && hitBoxContains(textHitBox(annotation, canvas, measure(annotation)), x, y)) return annotation.id;
		}
		return null;
	}

	private annotationAt(point: NormalizedPoint, canvas: CanvasSize, measure: MeasureText) {
		const toPixels = (p: NormalizedPoint) => ({ x: p.x * canvas[0], y: p.y * canvas[1] });
		const cursor = toPixels(point);
		for (let index = this.annotations.length - 1; index >= 0; index--) {
			const annotation = this.annotations[index];
			const hit =
				annotation.kind === 'text'
					? hitBoxContains(textHitBox(annotation, canvas, measure(annotation)), cursor.x, cursor.y)
					: strokeIntersectsPoint(annotation.points.map(toPixels), cursor, annotation.width / 2 + STROKE_HIT_SLOP);
			if (hit) return annotation.id;
		}
		return null;
	}
}
