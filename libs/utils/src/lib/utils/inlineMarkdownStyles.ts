import { EBacktickType } from '../types/messageLine';

export interface InlineStyleEntity {
	type: string;
	offset: number;
	length: number;
}

export interface StyleSegment {
	s: number;
	e: number;
	bold: boolean;
	italic: boolean;
	strike: boolean;
}

interface StyleMatch {
	type: 'MessageEntityBold' | 'MessageEntityItalic' | 'MessageEntityStrike';
	start: number;
	end: number;
	marker: number;
}

const PROTECTED_ENTITY_TYPES = new Set<string>([
	'MessageEntityCode',
	'MessageEntityPre',
	'MessageEntityUrl',
	'MessageEntityTextUrl',
	'MessageEntityMentionName',
	'MessageEntityMentionRole',
	'MessageEntityHashtag',
	'MessageEntityCustomEmoji'
]);

const WHITESPACE_RE = /^\s/;
const ALPHANUMERIC_END_RE = /[\p{L}\p{N}]$/u;
const ALPHANUMERIC_START_RE = /^[\p{L}\p{N}]/u;
const ESCAPABLE_STYLE_CHARS = new Set(['*', '_', '~']);
const URL_LIKE_RE = /((?:\w+:)?\/\/[^\s<>]+)/;

function isStyleEscape(text: string, pos: number, end: number, protectedEndAt: (p: number) => number): boolean {
	return text[pos] === '\\' && pos + 1 < end && ESCAPABLE_STYLE_CHARS.has(text[pos + 1]) && protectedEndAt(pos + 1) === -1;
}

export function escapeInlineStyles(text: string): string {
	return text
		.split(URL_LIKE_RE)
		.map((part, index) =>
			index % 2
				? part
				: part.replace(/[*_~]/g, (ch: string, pos: number) => {
						const prev = part[pos - 1] ?? '';
						const next = part[pos + 1] ?? '';
						if (/\s/.test(prev) && /\s/.test(next)) return ch;
						if (ch === '_' && ALPHANUMERIC_END_RE.test(prev) && ALPHANUMERIC_START_RE.test(next)) return ch;
						if (ch === '~' && prev !== '~' && next !== '~' && prev !== '\\') return ch;
						return `\\${ch}`;
					})
		)
		.join('');
}

function styleRunEnd(text: string, pos: number, end: number, protectedEndAt: (p: number) => number): number {
	const ch = text[pos];
	let k = pos;
	while (k < end && text[k] === ch && protectedEndAt(k) === -1) {
		k += 1;
	}
	return k;
}

function validStyleMarker(ch: string, len: number): boolean {
	if (ch === '*') return len >= 1 && len <= 3;
	if (ch === '_') return len === 1;
	if (ch === '~') return len === 2;
	return false;
}

function canOpenStyle(text: string, pos: number, runEnd: number, end: number): boolean {
	const ch = text[pos];
	const len = runEnd - pos;
	if (!validStyleMarker(ch, len)) {
		return false;
	}
	if (runEnd >= end || WHITESPACE_RE.test(text[runEnd])) {
		return false;
	}
	if (isIntrawordMarker(text, pos, len)) {
		return false;
	}
	return true;
}

function isIntrawordMarker(text: string, pos: number, len: number): boolean {
	const ch = text[pos];
	if (ch !== '_' && !(ch === '*' && len === 1)) {
		return false;
	}
	return pos > 0 && ALPHANUMERIC_END_RE.test(text.slice(Math.max(0, pos - 2), pos));
}

function canCloseStyle(text: string, openEnd: number, close: number, closeEnd: number): boolean {
	if (close <= openEnd || WHITESPACE_RE.test(text[close - 1])) {
		return false;
	}
	if (!/\S/.test(text.slice(openEnd, close))) {
		return false;
	}
	const closesIntraword = text[close] === '_' || (text[close] === '*' && closeEnd - close === 1);
	if (closesIntraword && closeEnd < text.length && ALPHANUMERIC_START_RE.test(text.slice(closeEnd, closeEnd + 2))) {
		return false;
	}
	return true;
}

function findStyleClose(text: string, open: number, len: number, end: number, protectedEndAt: (p: number) => number): number {
	const ch = text[open];
	const openEnd = open + len;
	let j = openEnd;
	while (j < end) {
		const protEnd = protectedEndAt(j);
		if (protEnd !== -1) {
			j = Math.min(protEnd, end);
			continue;
		}
		if (isStyleEscape(text, j, end, protectedEndAt)) {
			j += 2;
			continue;
		}
		if (text[j] !== ch) {
			j += 1;
			continue;
		}
		const kEnd = styleRunEnd(text, j, end, protectedEndAt);
		const kLen = kEnd - j;
		if (kLen === len) {
			if (canCloseStyle(text, openEnd, j, kEnd)) {
				return j;
			}
			if (canOpenStyle(text, j, kEnd, end)) {
				return -1;
			}
			j = kEnd;
		} else if (ch === '*') {
			if (isIntrawordMarker(text, j, kLen)) {
				j = kEnd;
				continue;
			}
			if (canOpenStyle(text, j, kEnd, end)) {
				const nestedClose = findStyleClose(text, j, kLen, end, protectedEndAt);
				if (nestedClose !== -1) {
					j = nestedClose + kLen;
					continue;
				}
			}
			return -1;
		} else {
			j = kEnd;
		}
	}
	return -1;
}

function scanStyles(text: string, start: number, end: number, protectedEndAt: (p: number) => number, out: StyleMatch[], escapes: number[]): void {
	let i = start;
	while (i < end) {
		const protEnd = protectedEndAt(i);
		if (protEnd !== -1) {
			i = Math.min(protEnd, end);
			continue;
		}
		if (isStyleEscape(text, i, end, protectedEndAt)) {
			escapes.push(i);
			i += 2;
			continue;
		}
		const ch = text[i];
		if (ch !== '*' && ch !== '_' && ch !== '~') {
			i += 1;
			continue;
		}
		const runEnd = styleRunEnd(text, i, end, protectedEndAt);
		const len = runEnd - i;
		if (canOpenStyle(text, i, runEnd, end)) {
			const close = findStyleClose(text, i, len, end, protectedEndAt);
			if (close !== -1) {
				const matchEnd = close + len;
				if (ch === '*' && len === 3) {
					out.push({ type: 'MessageEntityBold', start: i, end: matchEnd, marker: 3 });
					out.push({ type: 'MessageEntityItalic', start: i, end: matchEnd, marker: 3 });
				} else if (ch === '*' && len === 2) {
					out.push({ type: 'MessageEntityBold', start: i, end: matchEnd, marker: 2 });
				} else if ((ch === '*' && len === 1) || (ch === '_' && len === 1)) {
					out.push({ type: 'MessageEntityItalic', start: i, end: matchEnd, marker: 1 });
				} else if (ch === '~' && len === 2) {
					out.push({ type: 'MessageEntityStrike', start: i, end: matchEnd, marker: 2 });
				}
				scanStyles(text, runEnd, close, protectedEndAt, out, escapes);
				i = matchEnd;
				continue;
			}
		}
		i = runEnd;
	}
}

export function extractInlineStyles<T extends InlineStyleEntity = InlineStyleEntity>(
	text: string,
	entities: T[] = []
): { text: string; entities: T[] } {
	if (!text) {
		return { text: text || '', entities: [...entities] };
	}

	const protectedRanges: Array<{ s: number; e: number }> = [];
	for (const ent of entities) {
		if (PROTECTED_ENTITY_TYPES.has(ent.type) && ent.length > 0) {
			protectedRanges.push({ s: ent.offset, e: ent.offset + ent.length });
		}
	}

	const protectedEndAt = (pos: number): number => {
		let maxEnd = -1;
		for (const r of protectedRanges) {
			if (pos >= r.s && pos < r.e && r.e > maxEnd) {
				maxEnd = r.e;
			}
		}
		return maxEnd;
	};

	const n = text.length;
	const matches: StyleMatch[] = [];
	const escapes: number[] = [];
	let lineStart = 0;
	while (lineStart < n) {
		let lineEnd = lineStart;
		while (lineEnd < n && text[lineEnd] !== '\n') {
			lineEnd += 1;
		}
		if (lineEnd > lineStart) {
			scanStyles(text, lineStart, lineEnd, protectedEndAt, matches, escapes);
		}
		lineStart = lineEnd + 1;
	}

	if (matches.length === 0 && escapes.length === 0) {
		return { text, entities: [...entities] };
	}

	const removed = new Array<boolean>(n).fill(false);
	for (const pos of escapes) {
		removed[pos] = true;
	}
	for (const m of matches) {
		for (let k = m.start; k < m.start + m.marker; k++) {
			removed[k] = true;
		}
		for (let k = m.end - m.marker; k < m.end; k++) {
			removed[k] = true;
		}
	}

	let outText = '';
	const map = new Array<number>(n + 1);
	let stripped = 0;
	for (let idx = 0; idx < n; idx++) {
		map[idx] = stripped;
		if (!removed[idx]) {
			outText += text[idx];
			stripped += 1;
		}
	}
	map[n] = stripped;

	const remap = (offset: number): number => {
		if (offset <= 0) return 0;
		if (offset >= n) return stripped;
		return map[offset];
	};

	const shiftedEntities: T[] = entities.map((entity) => {
		const newStart = remap(entity.offset);
		const newEnd = remap(entity.offset + entity.length);
		return {
			...entity,
			offset: newStart,
			length: newEnd - newStart
		};
	});

	for (const m of matches) {
		const s = remap(m.start);
		const e = remap(m.end);
		shiftedEntities.push({
			type: m.type,
			offset: s,
			length: e - s
		} as T);
	}

	return {
		text: outText,
		entities: shiftedEntities
	};
}

export function styleAt(
	styles: ReadonlyArray<{ s?: number; e?: number; type?: EBacktickType | string }>,
	segS: number,
	segE: number
): { bold: boolean; italic: boolean; strike: boolean } {
	let bold = false;
	let italic = false;
	let strike = false;
	if (segE <= segS) {
		return { bold, italic, strike };
	}
	for (const st of styles) {
		const s = st.s ?? 0;
		const e = st.e ?? 0;
		if (e <= s) continue;
		if (s <= segS && e >= segE) {
			if (st.type === EBacktickType.BOLD) bold = true;
			else if (st.type === EBacktickType.ITALIC) italic = true;
			else if (st.type === EBacktickType.STRIKE) strike = true;
		}
	}
	return { bold, italic, strike };
}

export function styleSegments(
	styles: ReadonlyArray<{ s?: number; e?: number; type?: EBacktickType | string }>,
	a: number,
	b: number
): StyleSegment[] {
	if (b <= a) {
		return [];
	}
	const points: number[] = [a, b];
	for (const st of styles) {
		if (st.type !== EBacktickType.BOLD && st.type !== EBacktickType.ITALIC && st.type !== EBacktickType.STRIKE) {
			continue;
		}
		const s = st.s ?? 0;
		const e = st.e ?? 0;
		if (e <= s) continue;
		if (s > a && s < b) {
			points.push(s);
		}
		if (e > a && e < b) {
			points.push(e);
		}
	}
	points.sort((x, y) => x - y);
	const uniquePoints: number[] = [];
	for (const p of points) {
		if (uniquePoints.length === 0 || uniquePoints[uniquePoints.length - 1] !== p) {
			uniquePoints.push(p);
		}
	}

	const out: StyleSegment[] = [];
	let idx = 0;
	while (idx + 1 < uniquePoints.length) {
		const segS = uniquePoints[idx];
		let segE = uniquePoints[idx + 1];
		const cur = styleAt(styles, segS, segE);
		idx += 1;
		while (idx + 1 < uniquePoints.length) {
			const next = styleAt(styles, uniquePoints[idx], uniquePoints[idx + 1]);
			if (next.bold === cur.bold && next.italic === cur.italic && next.strike === cur.strike) {
				segE = uniquePoints[idx + 1];
				idx += 1;
			} else {
				break;
			}
		}
		out.push({
			s: segS,
			e: segE,
			bold: cur.bold,
			italic: cur.italic,
			strike: cur.strike
		});
	}
	return out;
}
