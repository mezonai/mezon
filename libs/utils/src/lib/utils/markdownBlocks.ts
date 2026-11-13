export type MarkdownBlockKind = 'ul' | 'ol' | 'quote';

export interface MarkdownBlockLine {
	lineStart: number;
	lineEnd: number;
	markerStart: number;
	contentStart: number;
	kind: MarkdownBlockKind;
	depth: number;
	marker: string;
}

export interface NamedLink {
	open: number;
	labelStart: number;
	labelEnd: number;
	urlStart: number;
	urlEnd: number;
	close: number;
}

const UL_RE = /^( *)([-*])( +)(?=\S)/;
const OL_RE = /^( *)(\d{1,9})([.)])( +)(?=\S)/;
const QUOTE_RE = /^>( ?)(?=.*\S)/;
const URL_LABEL_RE = /^\s*(https?:\/\/|www\.)/i;

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

		const ulMatch = UL_RE.exec(line);
		if (ulMatch) {
			const indent = ulMatch[1].length;
			const markerStart = lineStart + indent;
			const contentStart = lineStart + ulMatch[0].length;
			if (!isLineBlockedByOccupied(lineStart, contentStart, lineEnd, occupied)) {
				out.push({
					lineStart,
					lineEnd,
					markerStart,
					contentStart,
					kind: 'ul',
					depth: Math.min(3, Math.floor(indent / 2)),
					marker: '•'
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
		if (!label.trim()) continue;
		if (URL_LABEL_RE.test(label)) continue;

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
			close: e
		});
	}

	return out;
}
