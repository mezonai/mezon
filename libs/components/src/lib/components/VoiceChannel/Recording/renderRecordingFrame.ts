export interface RecordingDrawItem {
	image: CanvasImageSource | null;
	imageWidth: number;
	imageHeight: number;
	avatar: CanvasImageSource | null;
	label: string;
	initial: string;
	accent: string;
	focused: boolean;
	/** Screen shares are letterboxed (contain); cameras fill the tile (cover). */
	contain: boolean;
	speaking: boolean;
}

interface TileRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Draws one composited frame of the call, matching what the voice channel renders.
 *
 * Every constant below is lifted from the styles actually in play — LiveKit's
 * `@livekit/components-styles` custom properties plus this app's overrides — so the
 * file looks like the call rather than like a second design:
 *
 *   --lk-grid-gap: .5rem            → GAP 8            .lk-grid-layout padding + gap
 *   --lk-border-radius: .5rem       → RADIUS 8         .lk-participant-tile
 *   --lk-accent-bg: #1f8cf9         → speaking ring, 2.5px (--lk-speaking-indicator-width)
 *   --lk-bg2: #1e1e1e               → screen-share letterbox
 *   bgIconLight: #5C5E66            → .lk-participant-placeholder (app override)
 *   w-20 / !text-4xl                → 80px avatar, 36px initial (ParticipantTile)
 *   bg-[#00000080] p-[5px] rounded-md → the name pill
 *   !grid-rows-[5fr_1fr]            → focus/carousel split (FocusLayoutContainer)
 *   aspect-ratio 16/10              → .lk-carousel children
 *
 * IMPORTANT: this function is serialised with `Function.prototype.toString()` and
 * evaluated inside the compositor worker (see `compositorWorkerSource.ts`), so it
 * must stay completely self-contained — no imports, no closures over module scope,
 * and no syntax the bundler would rewrite into a tslib helper call.
 */
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

	// Defaults to 'low', a bilinear filter — visibly mushy when a source is scaled down.
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	// .lk-grid-layout-wrapper is `dark:bg-black`.
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
		// .lk-focus-layout, forced to one column and 5fr/1fr rows by the app.
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
			// .lk-carousel: flex row, gap, children locked to aspect-ratio 16/10,
			// centred while they all fit and left-aligned once they overflow.
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
		// GRID_LAYOUTS from @livekit/components-core, already sorted by maxTiles.
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
			// selectGridLayout skips a layout when a later one holds the same number of
			// tiles and suits the container orientation better.
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
		// The grid is always padded out to maxTiles with empty cells, so the row count
		// comes from the layout rather than from how many people are on the call.
		const rows = layouts[chosenIndex].rows;
		const maxTiles = columns * rows;

		const contentWidth = width - GAP * 2;
		const contentHeight = height - GAP * 2;
		const cellWidth = (contentWidth - GAP * (columns - 1)) / columns;
		const cellHeight = (contentHeight - GAP * (rows - 1)) / rows;

		for (let i = 0; i < count; i++) {
			if (i >= maxTiles) {
				// Beyond the first page; the app paginates these away too.
				rects[i] = null;
				continue;
			}
			const row = Math.floor(i / columns);
			const column = i - row * columns;
			rects[i] = { x: GAP + column * (cellWidth + GAP), y: GAP + row * (cellHeight + GAP), w: cellWidth, h: cellHeight };
		}
	}

	// Focus first: it is the largest surface and everything else sits beside it.
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
			// .lk-participant-media-video: black behind a camera, --lk-bg2 behind the
			// letterboxed screen share.
			ctx.fillStyle = item.contain ? '#1e1e1e' : '#000000';
			ctx.fillRect(x, y, w, h);

			const fit = item.contain ? Math.min(w / item.imageWidth, h / item.imageHeight) : Math.max(w / item.imageWidth, h / item.imageHeight);
			const drawWidth = item.imageWidth * fit;
			const drawHeight = item.imageHeight * fit;
			ctx.drawImage(item.image, x + (w - drawWidth) / 2, y + (h - drawHeight) / 2, drawWidth, drawHeight);
		} else {
			// .lk-participant-placeholder, overridden to bg-bgIconLight by the app.
			ctx.fillStyle = '#5C5E66';
			ctx.fillRect(x, y, w, h);

			// AvatarImage / AvatarColor are a fixed 80px in the tile, clipped when the
			// tile is smaller — same as the DOM, which relies on overflow:hidden.
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
			// .lk-participant-metadata sits 4px off the left and bottom edges; the item
			// inside is bg-[#00000080] p-[5px] rounded-md.
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
			// .lk-participant-tile[data-lk-speaking=true]::after
			ctx.save();
			ctx.strokeStyle = '#1f8cf9';
			ctx.lineWidth = SPEAKING_WIDTH;
			roundRectPath(x + SPEAKING_WIDTH / 2, y + SPEAKING_WIDTH / 2, w - SPEAKING_WIDTH, h - SPEAKING_WIDTH, RADIUS);
			ctx.stroke();
			ctx.restore();
		}
	}
}

/**
 * Same rule as `AvatarColor`, so a participant without a photo gets the identical
 * circle colour in the recording and on screen.
 */
export function accentColorFor(initial: string): string {
	const palette = ['#ade603', '#00b2cc', '#fda63c', '#e16dcc', '#e8467b', '#9c7cfd', '#22e2b3'];
	const char = (initial || '').charAt(0).toUpperCase();
	return palette[char ? char.charCodeAt(0) % 7 : 0];
}
