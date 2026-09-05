export interface RecordingDrawItem {
	image: CanvasImageSource | null;
	imageWidth: number;
	imageHeight: number;
	avatar: CanvasImageSource | null;
	label: string;
	initial: string;
	accent: string;
	focused: boolean;
	contain: boolean;
	speaking: boolean;
}

interface TileRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export function renderRecordingFrame(ctx: CanvasRenderingContext2D, width: number, height: number, items: RecordingDrawItem[]): void {
	const GAP = 8;
	const RADIUS = 8;
	const AVATAR_SIZE = 80;
	const AVATAR_FONT = 36;
	const NAME_FONT = 16;
	const META_INSET = 4;
	const META_PAD = 5;
	const META_RADIUS = 6;
	const SPEAKING_WIDTH = 2.5;
	const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width, height);

	const count = items.length;
	if (count === 0) {
		return;
	}

	const rects: (TileRect | null)[] = new Array(count);
	let focusIndex = -1;
	for (let i = 0; i < count; i++) {
		if (items[i].focused) {
			focusIndex = i;
			break;
		}
	}

	if (focusIndex >= 0) {
		const innerWidth = width - GAP * 2;
		const innerHeight = height - GAP * 2 - GAP;
		const focusHeight = (innerHeight * 5) / 6;
		const carouselHeight = innerHeight - focusHeight;

		rects[focusIndex] = { x: GAP, y: GAP, w: innerWidth, h: focusHeight };

		const others: number[] = [];
		for (let i = 0; i < count; i++) {
			if (i !== focusIndex) {
				others.push(i);
			}
		}

		if (others.length > 0) {
			const cellWidth = (carouselHeight * 16) / 10;
			const carouselY = GAP + focusHeight + GAP;
			const totalWidth = others.length * cellWidth + (others.length - 1) * GAP;
			const startX = totalWidth <= innerWidth ? GAP + (innerWidth - totalWidth) / 2 : GAP;

			for (let i = 0; i < others.length; i++) {
				const x = startX + i * (cellWidth + GAP);
				rects[others[i]] = x + cellWidth <= width - GAP ? { x, y: carouselY, w: cellWidth, h: carouselHeight } : null;
			}
		}
	} else {
		const layouts = [
			{ columns: 1, rows: 1, minWidth: 0, orientation: '' },
			{ columns: 1, rows: 2, minWidth: 0, orientation: 'portrait' },
			{ columns: 2, rows: 1, minWidth: 0, orientation: 'landscape' },
			{ columns: 2, rows: 2, minWidth: 560, orientation: '' },
			{ columns: 3, rows: 3, minWidth: 700, orientation: '' },
			{ columns: 4, rows: 4, minWidth: 960, orientation: '' },
			{ columns: 5, rows: 5, minWidth: 1100, orientation: '' }
		];
		const orientation = width / height > 1 ? 'landscape' : 'portrait';

		let chosenIndex = layouts.length - 1;
		for (let i = 0; i < layouts.length; i++) {
			const maxTiles = layouts[i].columns * layouts[i].rows;
			if (maxTiles < count) {
				continue;
			}
			let biggerAvailable = false;
			for (let j = i + 1; j < layouts.length; j++) {
				const other = layouts[j];
				if (other.columns * other.rows === maxTiles && (!other.orientation || other.orientation === orientation)) {
					biggerAvailable = true;
					break;
				}
			}
			if (!biggerAvailable) {
				chosenIndex = i;
				break;
			}
		}
		while (chosenIndex > 0 && width < layouts[chosenIndex].minWidth) {
			chosenIndex--;
		}

		const columns = layouts[chosenIndex].columns;
		const rows = layouts[chosenIndex].rows;
		const maxTiles = columns * rows;

		const contentWidth = width - GAP * 2;
		const contentHeight = height - GAP * 2;
		const cellWidth = (contentWidth - GAP * (columns - 1)) / columns;
		const cellHeight = (contentHeight - GAP * (rows - 1)) / rows;

		for (let i = 0; i < count; i++) {
			if (i >= maxTiles) {
				rects[i] = null;
				continue;
			}
			const row = Math.floor(i / columns);
			const column = i - row * columns;
			rects[i] = { x: GAP + column * (cellWidth + GAP), y: GAP + row * (cellHeight + GAP), w: cellWidth, h: cellHeight };
		}
	}

	if (focusIndex >= 0 && rects[focusIndex]) {
		drawTile(items[focusIndex], rects[focusIndex] as TileRect);
	}
	for (let i = 0; i < count; i++) {
		const rect = rects[i];
		if (rect && i !== focusIndex) {
			drawTile(items[i], rect);
		}
	}

	function roundRectPath(x: number, y: number, w: number, h: number, r: number) {
		const radius = Math.min(r, w / 2, h / 2);
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + w - radius, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
		ctx.lineTo(x + w, y + h - radius);
		ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
		ctx.lineTo(x + radius, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	}

	function drawTile(item: RecordingDrawItem, rect: TileRect) {
		const x = Math.round(rect.x);
		const y = Math.round(rect.y);
		const w = Math.round(rect.w);
		const h = Math.round(rect.h);
		if (w < 4 || h < 4) {
			return;
		}

		ctx.save();
		roundRectPath(x, y, w, h, RADIUS);
		ctx.clip();

		if (item.image && item.imageWidth > 0 && item.imageHeight > 0) {
			ctx.fillStyle = item.contain ? '#1e1e1e' : '#000000';
			ctx.fillRect(x, y, w, h);

			const fit = item.contain ? Math.min(w / item.imageWidth, h / item.imageHeight) : Math.max(w / item.imageWidth, h / item.imageHeight);
			const drawWidth = item.imageWidth * fit;
			const drawHeight = item.imageHeight * fit;
			ctx.drawImage(item.image, x + (w - drawWidth) / 2, y + (h - drawHeight) / 2, drawWidth, drawHeight);
		} else {
			ctx.fillStyle = '#5C5E66';
			ctx.fillRect(x, y, w, h);

			const size = AVATAR_SIZE;
			const cx = x + w / 2;
			const cy = y + h / 2;
			if (item.avatar) {
				ctx.save();
				ctx.beginPath();
				ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(item.avatar, cx - size / 2, cy - size / 2, size, size);
				ctx.restore();
			} else {
				ctx.fillStyle = item.accent;
				ctx.beginPath();
				ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#ffffff';
				ctx.font = `600 ${AVATAR_FONT}px ${FONT_STACK}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(item.initial, cx, cy + 1);
			}
		}

		if (item.label) {
			ctx.font = `${NAME_FONT}px ${FONT_STACK}`;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';

			let text = item.label;
			const maxTextWidth = w - META_INSET * 2 - META_PAD * 2;
			let textWidth = ctx.measureText(text).width;
			if (textWidth > maxTextWidth && maxTextWidth > 0) {
				while (text.length > 1 && ctx.measureText(`${text}…`).width > maxTextWidth) {
					text = text.substring(0, text.length - 1);
				}
				text = `${text}…`;
				textWidth = ctx.measureText(text).width;
			}

			const pillHeight = NAME_FONT + META_PAD * 2;
			const pillWidth = textWidth + META_PAD * 2;
			const pillX = x + META_INSET;
			const pillY = y + h - META_INSET - pillHeight;

			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			roundRectPath(pillX, pillY, pillWidth, pillHeight, META_RADIUS);
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.fillText(text, pillX + META_PAD, pillY + pillHeight / 2);
		}

		ctx.restore();

		if (item.speaking) {
			ctx.save();
			ctx.strokeStyle = '#1f8cf9';
			ctx.lineWidth = SPEAKING_WIDTH;
			roundRectPath(x + SPEAKING_WIDTH / 2, y + SPEAKING_WIDTH / 2, w - SPEAKING_WIDTH, h - SPEAKING_WIDTH, RADIUS);
			ctx.stroke();
			ctx.restore();
		}
	}
}

export function accentColorFor(initial: string): string {
	const palette = ['#ade603', '#00b2cc', '#fda63c', '#e16dcc', '#e8467b', '#9c7cfd', '#22e2b3'];
	const char = (initial || '').charAt(0).toUpperCase();
	return palette[char ? char.charCodeAt(0) % 7 : 0];
}
