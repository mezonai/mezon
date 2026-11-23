export type MarkdownBlockKind = 'ul' | 'ol' | 'quote' | 'hr' | 'table';

export type MarkdownTableAlign = 'left' | 'center' | 'right' | undefined;

export interface MarkdownBlockLine {
	lineStart: number;
	lineEnd: number;
	markerStart: number;
	contentStart: number;
	kind: MarkdownBlockKind;
	depth: number;
	marker: string;
	checked?: boolean;
	rows?: Array<Array<{ s: number; e: number }>>;
	align?: MarkdownTableAlign[];
}

export interface NamedLink {
	open: number;
	labelStart: number;
	labelEnd: number;
	urlStart: number;
	urlEnd: number;
	close: number;
	image?: boolean;
}

const UL_RE = /^( *)([-*])( +)(?=\S)/;
const OL_RE = /^( *)(\d{1,9})([.)])( +)(?=\S)/;
const QUOTE_RE = /^>( ?)(?=.*\S)/;
const HR_RE = /^ {0,3}([-*_])(?: *\1){2,} *$/;
const TASK_RE = /^\[([ xX])\] +(?=\S)/;
const TABLE_DELIMITER_RE = /^:?-+:?$/;
const URL_LABEL_RE = /^\s*(https?:\/\/|www\.)/i;
const HEADING_RE = /^#{1,6}\s+\S/;
const TABLE_START_RE = /^ *\|(?!\|)/;

export function isMarkdownBlockLine(line: string): boolean {
	return HEADING_RE.test(line) || HR_RE.test(line) || UL_RE.test(line) || OL_RE.test(line) || QUOTE_RE.test(line) || TABLE_START_RE.test(line);
}

export function findBlockEscapes(t: string, blocks: ReadonlyArray<MarkdownBlockLine>): number[] {
	const candidates = [
		...Array.from(t.matchAll(/^ *\\/gm), (match) => ({ pos: (match.index ?? 0) + match[0].length - 1, task: false })),
		...blocks.filter((block) => block.contentStart < block.lineEnd).map((block) => ({ pos: block.contentStart, task: block.kind === 'ul' }))
	];
	return candidates
		.filter(({ pos, task }) => {
			if (t[pos] !== '\\') return false;
			const lineEnd = t.indexOf('\n', pos);
			const rest = t.slice(pos + 1, lineEnd === -1 ? t.length : lineEnd);
			return isMarkdownBlockLine(rest) || (task && TASK_RE.test(rest));
		})
		.map(({ pos }) => pos)
		.sort((a, b) => a - b);
}

function findTableCells(
	t: string,
	lineStart: number,
	lineEnd: number,
	occupied: ReadonlyArray<{ s?: number; e?: number }>
): Array<{ s: number; e: number }> | null {
	const pipes: number[] = [];
	for (let i = lineStart; i < lineEnd; i++) {
		if (t[i] === '\\') {
			i++;
		} else if (t[i] === '|' && !occupied.some((item) => (item.s ?? 0) <= i && i < (item.e ?? 0))) {
			pipes.push(i);
		}
	}
	if (!pipes.length || t.slice(lineStart, pipes[0]).trim()) return null;
	const bounds = t.slice(pipes[pipes.length - 1] + 1, lineEnd).trim() ? [...pipes, lineEnd] : pipes;
	const cells: Array<{ s: number; e: number }> = [];
	for (let k = 0; k + 1 < bounds.length; k++) {
		let s = bounds[k] + 1;
		let e = bounds[k + 1];
		while (s < e && /\s/.test(t[s])) s++;
		while (e > s && /\s/.test(t[e - 1])) e--;
		cells.push({ s, e });
	}
	return cells.length ? cells : null;
}

function findTable(t: string, lineStart: number, occupied: ReadonlyArray<{ s?: number; e?: number }>): MarkdownBlockLine | null {
	const lineEndAt = (start: number) => (t.indexOf('\n', start) === -1 ? t.length : t.indexOf('\n', start));
	const headerEnd = lineEndAt(lineStart);
	if (headerEnd >= t.length) return null;
	const delimiterEnd = lineEndAt(headerEnd + 1);
	const header = findTableCells(t, lineStart, headerEnd, occupied);
	const delimiter = findTableCells(t, headerEnd + 1, delimiterEnd, occupied);
	if (
		!header ||
		!delimiter ||
		header.length !== delimiter.length ||
		!delimiter.every((cell) => TABLE_DELIMITER_RE.test(t.slice(cell.s, cell.e))) ||
		isLineBlockedByOccupied(lineStart, lineStart, headerEnd, occupied) ||
		isLineBlockedByOccupied(headerEnd + 1, headerEnd + 1, delimiterEnd, occupied)
	) {
		return null;
	}
	const rows = [header];
	let tableEnd = delimiterEnd;
	while (tableEnd < t.length) {
		const rowEnd = lineEndAt(tableEnd + 1);
		const cells = findTableCells(t, tableEnd + 1, rowEnd, occupied);
		if (!cells || isLineBlockedByOccupied(tableEnd + 1, tableEnd + 1, rowEnd, occupied)) break;
		rows.push(cells);
		tableEnd = rowEnd;
	}
	return {
		lineStart,
		lineEnd: tableEnd,
		markerStart: lineStart,
		contentStart: lineStart,
		kind: 'table',
		depth: 0,
		marker: '',
		rows,
		align: delimiter.map((cell) => {
			const spec = t.slice(cell.s, cell.e);
			const left = spec.startsWith(':');
			const right = spec.endsWith(':');
			return left && right ? 'center' : right ? 'right' : left ? 'left' : undefined;
		})
	};
}

function isLineBlockedByOccupied(
	lineStart: number,
	contentStart: number,
	lineEnd: number,
	occupied: ReadonlyArray<{ s?: number; e?: number }>
): boolean {
	for (const item of occupied) {
		const s = item.s ?? 0;
		const e = item.e ?? 0;
		if (e <= s) continue;
		if (s < contentStart && e > lineStart) return true;
		if (s < lineStart && e > lineStart) return true;
		if (s >= lineStart && s < lineEnd && e > lineEnd) return true;
	}
	return false;
}

export function findMarkdownBlockLines(t: string, occupied: ReadonlyArray<{ s?: number; e?: number }>): MarkdownBlockLine[] {
	if (!t) return [];
	const out: MarkdownBlockLine[] = [];
	const n = t.length;
	let lineStart = 0;

	while (lineStart < n) {
		const nl = t.indexOf('\n', lineStart);
		const lineEnd = nl === -1 ? n : nl;
		const line = t.slice(lineStart, lineEnd);

		const table = line.trimStart().startsWith('|') ? findTable(t, lineStart, occupied) : null;
		if (table) {
			out.push(table);
			lineStart = table.lineEnd + 1;
			continue;
		}

		const isHr = HR_RE.test(line);
		const ulMatch = isHr ? null : UL_RE.exec(line);
		if (isHr) {
			if (!isLineBlockedByOccupied(lineStart, lineEnd, lineEnd, occupied)) {
				out.push({ lineStart, lineEnd, markerStart: lineStart, contentStart: lineEnd, kind: 'hr', depth: 0, marker: '' });
			}
		} else if (ulMatch) {
			const indent = ulMatch[1].length;
			const markerStart = lineStart + indent;
			const task = TASK_RE.exec(line.slice(ulMatch[0].length));
			const contentStart = lineStart + ulMatch[0].length + (task ? task[0].length : 0);
			if (!isLineBlockedByOccupied(lineStart, contentStart, lineEnd, occupied)) {
				out.push({
					lineStart,
					lineEnd,
					markerStart,
					contentStart,
					kind: 'ul',
					depth: Math.min(3, Math.floor(indent / 2)),
					marker: task ? '' : '•',
					...(task && { checked: task[1] !== ' ' })
				});
			}
		} else {
			const olMatch = OL_RE.exec(line);
			if (olMatch) {
				const indent = olMatch[1].length;
				const markerStart = lineStart + indent;
				const contentStart = lineStart + olMatch[0].length;
				if (!isLineBlockedByOccupied(lineStart, contentStart, lineEnd, occupied)) {
					out.push({
						lineStart,
						lineEnd,
						markerStart,
						contentStart,
						kind: 'ol',
						depth: Math.min(3, Math.floor(indent / 2)),
						marker: `${olMatch[2]}${olMatch[3]}`
					});
				}
			} else {
				const quoteMatch = QUOTE_RE.exec(line);
				if (quoteMatch) {
					const markerStart = lineStart;
					const contentStart = lineStart + quoteMatch[0].length;
					if (!isLineBlockedByOccupied(lineStart, contentStart, lineEnd, occupied)) {
						out.push({
							lineStart,
							lineEnd,
							markerStart,
							contentStart,
							kind: 'quote',
							depth: 0,
							marker: ''
						});
					}
				}
			}
		}

		lineStart = lineEnd + 1;
	}

	return out;
}

export function findNamedLinks(
	t: string,
	links: ReadonlyArray<{ s?: number; e?: number }>,
	occupied: ReadonlyArray<{ s?: number; e?: number }>
): Map<number, NamedLink> {
	const out = new Map<number, NamedLink>();
	if (!t || links.length === 0) return out;

	for (const link of links) {
		const s = link.s ?? -1;
		const e = link.e ?? -1;
		if (s < 3 || e <= s || e >= t.length) continue;
		if (t[s - 1] !== '(' || t[e] !== ')' || t[s - 2] !== ']') continue;

		const url = t.slice(s, e);
		if (!url.startsWith('http://') && !url.startsWith('https://')) continue;

		let open = -1;
		for (let i = s - 3; i >= 0; i--) {
			const ch = t[i];
			if (ch === '[') {
				open = i;
				break;
			}
			if (ch === ']' || ch === '\n') {
				break;
			}
		}
		if (open === -1) continue;

		const labelStart = open + 1;
		const labelEnd = s - 2;
		const label = t.slice(labelStart, labelEnd);
		const image = open > 0 && t[open - 1] === '!';
		if (image) open -= 1;
		else if (!label.trim() || URL_LABEL_RE.test(label)) continue;

		let skippedSelf = false;
		let blocked = false;
		for (const item of occupied) {
			const os = item.s ?? 0;
			const oe = item.e ?? 0;
			if (oe <= os) continue;
			if (!skippedSelf && (item === link || (os === s && oe === e))) {
				skippedSelf = true;
				continue;
			}
			if (os < e + 1 && oe > open) {
				blocked = true;
				break;
			}
		}
		if (blocked) continue;

		out.set(s, {
			open,
			labelStart,
			labelEnd,
			urlStart: s,
			urlEnd: e,
			close: e,
			...(image && { image })
		});
	}

	return out;
}
