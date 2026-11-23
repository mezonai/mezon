import { EBacktickType } from '../types/messageLine';
import { isMarkdownBlockLine } from './markdownBlocks';

export interface InlineStyleEntity {
	type: string;
	offset: number;
	length: number;
}

export interface InlineStyleFlags {
	bold: boolean;
	italic: boolean;
	strike: boolean;
	underline: boolean;
	spoiler: number;
}

export interface StyleSegment extends InlineStyleFlags {
	s: number;
	e: number;
}

type StyleEntityType = 'MessageEntityBold' | 'MessageEntityItalic' | 'MessageEntityStrike' | 'MessageEntityUnderline' | 'MessageEntitySpoiler';

interface StyleMatch {
	type: StyleEntityType;
	start: number;
	end: number;
	marker: number;
}

const STYLE_TYPES_BY_MARKER: Record<string, StyleEntityType[]> = {
	'*': ['MessageEntityItalic'],
	'**': ['MessageEntityBold'],
	'***': ['MessageEntityBold', 'MessageEntityItalic'],
	_: ['MessageEntityItalic'],
	__: ['MessageEntityUnderline'],
	___: ['MessageEntityUnderline', 'MessageEntityItalic'],
	'~~': ['MessageEntityStrike'],
	'||': ['MessageEntitySpoiler']
};

const INLINE_STYLE_TYPES = new Set<string>([
	EBacktickType.BOLD,
	EBacktickType.ITALIC,
	EBacktickType.STRIKE,
	EBacktickType.UNDERLINE,
	EBacktickType.SPOILER
]);

export const isInlineStyleType = (type?: string) => !!type && INLINE_STYLE_TYPES.has(type);

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
const ESCAPABLE_STYLE_CHARS = new Set(['*', '_', '~', '|']);
const TABLE_ROW_RE = /^ *\|/;
const URL_LIKE_RE = /((?:\w+:)?\/\/[^\s<>]+)/;
const PLAIN_PROTECTED_RE = /```[\s\S]*?```|`[^`\n]+`|(?:\w+:)?\/\/[^\s<>]+/g;

function isStyleEscape(text: string, pos: number, end: number, protectedEndAt: (p: number) => number): boolean {
	const isPipePair = text[pos + 2] === '|' || text[pos - 1] === '|' || (text[pos + 2] === '\\' && text[pos + 3] === '|');
	return (
		text[pos] === '\\' &&
		pos + 1 < end &&
		ESCAPABLE_STYLE_CHARS.has(text[pos + 1]) &&
		(text[pos + 1] !== '|' || isPipePair) &&
		protectedEndAt(pos + 1) === -1
	);
}

function keepsTablePipeEscape(text: string, pos: number): boolean {
	return text[pos + 1] === '|' && TABLE_ROW_RE.test(text.slice(text.lastIndexOf('\n', pos) + 1));
}

export function escapeInlineStyles(text: string): string {
	return text
		.split(URL_LIKE_RE)
		.map((part, index) =>
			index % 2
				? part
				: part.replace(/(?<![|\\])\|\|(?!\|)|[*_~]/g, (ch: string, pos: number) => {
						const prev = part[pos - 1] ?? '';
						const next = part[pos + ch.length] ?? '';
						if (/\s/.test(prev) && /\s/.test(next)) return ch;
						if (ch === '_' && ALPHANUMERIC_END_RE.test(prev) && ALPHANUMERIC_START_RE.test(next)) return ch;
						if (ch === '~' && prev !== '~' && next !== '~' && prev !== '\\') return ch;
						return ch.replace(/./g, '\\$&');
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
	return !!STYLE_TYPES_BY_MARKER[ch.repeat(len)];
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
	if (len !== 1 || (ch !== '_' && ch !== '*')) {
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
	const closesIntraword = (text[close] === '_' || text[close] === '*') && closeEnd - close === 1;
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
		if (ch !== '*' && ch !== '_' && ch !== '~' && ch !== '|') {
			i += 1;
			continue;
		}
		const runEnd = styleRunEnd(text, i, end, protectedEndAt);
		const len = runEnd - i;
		if (canOpenStyle(text, i, runEnd, end)) {
			const close = findStyleClose(text, i, len, end, protectedEndAt);
			if (close !== -1) {
				const matchEnd = close + len;
				for (const type of STYLE_TYPES_BY_MARKER[ch.repeat(len)]) {
					out.push({ type, start: i, end: matchEnd, marker: len });
				}
				scanStyles(text, runEnd, close, protectedEndAt, out, escapes);
				i = matchEnd;
				continue;
			}
		}
		i = runEnd;
	}
}

function protectedEndAtFor(ranges: ReadonlyArray<{ s: number; e: number }>): (pos: number) => number {
	return (pos: number): number => {
		let maxEnd = -1;
		for (const r of ranges) {
			if (pos >= r.s && pos < r.e && r.e > maxEnd) {
				maxEnd = r.e;
			}
		}
		return maxEnd;
	};
}

function scanInlineStyles(text: string, protectedEndAt: (pos: number) => number): { matches: StyleMatch[]; escapes: number[] } {
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
	return { matches, escapes };
}

export function escapeMatchedInlineStyles(text: string): string {
	let out = text;
	for (let pass = 0; ; pass++) {
		const current = out;
		const ranges = Array.from(current.matchAll(PLAIN_PROTECTED_RE), (match) => ({
			s: match.index ?? 0,
			e: (match.index ?? 0) + match[0].length
		}));
		const { matches, escapes } = scanInlineStyles(current, protectedEndAtFor(ranges));
		const marks = new Set(pass ? [] : escapes.filter((pos) => !keepsTablePipeEscape(current, pos)).map((pos) => pos + 1));
		for (const m of matches) {
			for (let k = 0; k < m.marker; k++) {
				marks.add(m.start + k);
				marks.add(m.end - m.marker + k);
			}
		}
		if (!marks.size) {
			return current;
		}
		out = current
			.split('')
			.map((ch, idx) => (marks.has(idx) ? `\\${ch}` : ch))
			.join('');
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

	const n = text.length;
	const { matches, escapes } = scanInlineStyles(text, protectedEndAtFor(protectedRanges));

	if (matches.length === 0 && escapes.length === 0) {
		return { text, entities: [...entities] };
	}

	const removed = new Array<boolean>(n).fill(false);
	for (const pos of escapes) {
		removed[pos] = !keepsTablePipeEscape(text, pos);
	}
	for (const m of matches) {
		for (let k = m.start; k < m.start + m.marker; k++) {
			removed[k] = true;
		}
		for (let k = m.end - m.marker; k < m.end; k++) {
			removed[k] = true;
		}
	}
	for (const pos of escapes) {
		const lineStart = text.lastIndexOf('\n', pos) + 1;
		if (!removed[pos] || text.slice(lineStart, pos).trim()) {
			continue;
		}
		const lineEnd = text.indexOf('\n', pos) === -1 ? n : text.indexOf('\n', pos);
		let rest = '';
		for (let k = pos + 1; k < lineEnd; k++) {
			if (!removed[k]) {
				rest += text[k];
			}
		}
		removed[pos] = !isMarkdownBlockLine(rest);
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
): InlineStyleFlags {
	const style: InlineStyleFlags = { bold: false, italic: false, strike: false, underline: false, spoiler: -1 };
	if (segE <= segS) {
		return style;
	}
	for (const st of styles) {
		const s = st.s ?? 0;
		const e = st.e ?? 0;
		if (e <= s) continue;
		if (s <= segS && e >= segE) {
			if (st.type === EBacktickType.BOLD) style.bold = true;
			else if (st.type === EBacktickType.ITALIC) style.italic = true;
			else if (st.type === EBacktickType.STRIKE) style.strike = true;
			else if (st.type === EBacktickType.UNDERLINE) style.underline = true;
			else if (st.type === EBacktickType.SPOILER) style.spoiler = s;
		}
	}
	return style;
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
		if (!isInlineStyleType(st.type)) {
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
			if (
				next.bold === cur.bold &&
				next.italic === cur.italic &&
				next.strike === cur.strike &&
				next.underline === cur.underline &&
				next.spoiler === cur.spoiler
			) {
				segE = uniquePoints[idx + 1];
				idx += 1;
			} else {
				break;
			}
		}
		out.push({ s: segS, e: segE, ...cur });
	}
	return out;
}
