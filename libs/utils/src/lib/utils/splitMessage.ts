import type { IMarkdownOnMessage, IMessageSendPayload, IStartEndIndex } from '../types';
import { EBacktickType } from '../types/messageLine';

export const MESSAGE_CHAR_LIMIT = 2048;
export const MESSAGE_CHAR_LIMIT_PRO = 4096;
export const MESSAGE_CHAR_LIMIT_BOT = 4096;
export const MESSAGE_FILE_LIMIT_MULTIPLIER = 3;

const LINK_MARKDOWN_TYPES = new Set<EBacktickType>([
	EBacktickType.LINK,
	EBacktickType.VOICE_LINK,
	EBacktickType.LINKYOUTUBE,
	EBacktickType.LINKFACEBOOK,
	EBacktickType.LINKTIKTOK,
	EBacktickType.OGP_PREVIEW
]);

const HANDLED_PAYLOAD_KEYS = new Set(['t', 'hg', 'ej', 'lk', 'vk', 'mk', 'cvtt', 'mentions']);

export function getMessageCharLimit({ isPro, isBot }: { isPro?: boolean; isBot?: boolean } = {}): number {
	if (isBot) {
		return MESSAGE_CHAR_LIMIT_BOT;
	}
	if (isPro) {
		return MESSAGE_CHAR_LIMIT_PRO;
	}
	return MESSAGE_CHAR_LIMIT;
}

export function countMessageChars(text: string): number {
	return Array.from(text).length;
}

function utf16IndexAfterCodePoints(text: string, start: number, limit: number): number {
	let idx = start;
	let count = 0;
	while (idx < text.length && count < limit) {
		const code = text.codePointAt(idx);
		idx += code !== undefined && code > 0xffff ? 2 : 1;
		count += 1;
	}
	return idx;
}

function findParagraphBreak(text: string, start: number, scanLimit: number): { end: number; next: number } | null {
	let paraEnd = -1;
	let paraNext = -1;
	let i = start + 1;
	while (i <= scanLimit) {
		if (text[i] === '\n') {
			let j = i + 1;
			let foundBlank = false;
			while (j < text.length) {
				let k = j;
				while (k < text.length && (text[k] === ' ' || text[k] === '\t' || text[k] === '\r')) {
					k += 1;
				}
				if (k < text.length && text[k] === '\n') {
					foundBlank = true;
					j = k + 1;
				} else {
					break;
				}
			}
			if (foundBlank) {
				paraEnd = i;
				paraNext = j;
				i = j;
				continue;
			}
		}
		i += 1;
	}
	if (paraEnd === -1) {
		return null;
	}
	return { end: paraEnd, next: paraNext };
}

function findLastMatchBreak(
	text: string,
	start: number,
	scanLimit: number,
	predicate: (ch: string) => boolean
): { end: number; next: number } | null {
	for (let i = scanLimit; i > start; i -= 1) {
		if (predicate(text[i])) {
			return { end: i, next: i + 1 };
		}
	}
	return null;
}

export function splitMessageRanges(
	text: string,
	limit: number,
	atomicRanges: Array<{ s: number; e: number }> = []
): Array<{ start: number; end: number }> {
	if (limit <= 0 || countMessageChars(text) <= limit) {
		return [{ start: 0, end: text.length }];
	}

	const validAtomic = atomicRanges.filter((range) => range.s >= 0 && range.e > range.s && range.e <= text.length);
	const ranges: Array<{ start: number; end: number }> = [];
	let start = 0;

	while (start < text.length) {
		if (countMessageChars(text.slice(start)) <= limit) {
			if (text.slice(start).trim().length > 0) {
				ranges.push({ start, end: text.length });
			}
			break;
		}

		const maxEnd = utf16IndexAfterCodePoints(text, start, limit);
		const scanLimit = Math.min(maxEnd, text.length - 1);

		const picked = findParagraphBreak(text, start, scanLimit) ??
			findLastMatchBreak(text, start, scanLimit, (ch) => ch === '\n') ??
			findLastMatchBreak(text, start, scanLimit, (ch) => ch === ' ' || ch === '\t') ?? {
				end: maxEnd,
				next: maxEnd
			};

		let { end, next } = picked;

		let adjusted = true;
		while (adjusted) {
			adjusted = false;
			let minStart = -1;
			let maxAtomicEnd = -1;

			for (const range of validAtomic) {
				if (range.s < end && end < range.e) {
					if (range.s <= start) {
						if (range.e > maxAtomicEnd) {
							maxAtomicEnd = range.e;
						}
					} else if (minStart === -1 || range.s < minStart) {
						minStart = range.s;
					}
				}
			}

			if (maxAtomicEnd !== -1) {
				end = maxAtomicEnd;
				next = maxAtomicEnd;
				break;
			}

			if (minStart !== -1) {
				end = minStart;
				next = minStart;
				adjusted = true;
			}
		}

		if (text.slice(start, end).trim().length > 0) {
			ranges.push({ start, end });
		}
		start = next;
	}

	return ranges;
}

function collectAtomicRanges(items: ReadonlyArray<IStartEndIndex> | undefined, target: Array<{ s: number; e: number }>): void {
	if (!items) {
		return;
	}
	for (const item of items) {
		if (typeof item.s === 'number' && typeof item.e === 'number') {
			target.push({ s: item.s, e: item.e });
		}
	}
}

function shiftAtomicEntities<T extends IStartEndIndex>(items: ReadonlyArray<T> | undefined, start: number, end: number): T[] {
	if (!items || items.length === 0) {
		return [];
	}
	const result: T[] = [];
	for (const item of items) {
		if (typeof item.s === 'number' && typeof item.e === 'number' && item.s >= start && item.e <= end) {
			result.push({
				...item,
				s: item.s - start,
				e: item.e - start
			});
		}
	}
	return result;
}

function sliceMarkdownEntities(items: ReadonlyArray<IMarkdownOnMessage> | undefined, start: number, end: number): IMarkdownOnMessage[] {
	if (!items || items.length === 0) {
		return [];
	}
	const result: IMarkdownOnMessage[] = [];
	for (const item of items) {
		if (typeof item.s !== 'number' || typeof item.e !== 'number') {
			continue;
		}
		if (item.type !== undefined && LINK_MARKDOWN_TYPES.has(item.type)) {
			if (item.s >= start && item.e <= end) {
				result.push({
					...item,
					s: item.s - start,
					e: item.e - start
				});
			}
		} else {
			const clippedStart = Math.max(item.s, start);
			const clippedEnd = Math.min(item.e, end);
			if (clippedEnd > clippedStart) {
				result.push({
					...item,
					s: clippedStart - start,
					e: clippedEnd - start
				});
			}
		}
	}
	return result;
}

export function splitMessagePayload<M extends { s?: number; e?: number }>(
	content: IMessageSendPayload,
	mentions: M[] | undefined,
	limit: number
): Array<{ content: IMessageSendPayload; mentions: M[] }> {
	const text = content.t ?? '';
	const safeMentions = mentions ?? [];

	if (limit <= 0 || countMessageChars(text) <= limit) {
		return [{ content, mentions: safeMentions }];
	}

	const contentWithMentions = content as IMessageSendPayload & { mentions?: M[] };
	const contentMentions = Array.isArray(contentWithMentions.mentions) ? contentWithMentions.mentions : undefined;

	const atomicRanges: Array<{ s: number; e: number }> = [];
	collectAtomicRanges(safeMentions, atomicRanges);
	collectAtomicRanges(contentMentions, atomicRanges);
	collectAtomicRanges(content.hg, atomicRanges);
	collectAtomicRanges(content.ej, atomicRanges);
	collectAtomicRanges(content.lk, atomicRanges);
	collectAtomicRanges(content.vk, atomicRanges);
	if (content.mk) {
		for (const item of content.mk) {
			if (item.type !== undefined && LINK_MARKDOWN_TYPES.has(item.type) && typeof item.s === 'number' && typeof item.e === 'number') {
				atomicRanges.push({ s: item.s, e: item.e });
			}
		}
	}

	const ranges = splitMessageRanges(text, limit, atomicRanges);
	if (ranges.length === 1 && ranges[0].start === 0 && ranges[0].end === text.length) {
		return [{ content, mentions: safeMentions }];
	}

	const extraFields: Record<string, unknown> = {};
	for (const key of Object.keys(content)) {
		if (!HANDLED_PAYLOAD_KEYS.has(key)) {
			extraFields[key] = (content as Record<string, unknown>)[key];
		}
	}

	return ranges.map((range, index) => {
		const partContent: IMessageSendPayload =
			index === 0
				? {
						...(extraFields as Partial<IMessageSendPayload>),
						t: text.slice(range.start, range.end)
					}
				: {
						t: text.slice(range.start, range.end)
					};

		const hg = shiftAtomicEntities(content.hg, range.start, range.end);
		if (hg.length > 0) {
			partContent.hg = hg;
		}

		const ej = shiftAtomicEntities(content.ej, range.start, range.end);
		if (ej.length > 0) {
			partContent.ej = ej;
		}

		const lk = shiftAtomicEntities(content.lk, range.start, range.end);
		if (lk.length > 0) {
			partContent.lk = lk;
		}

		const vk = shiftAtomicEntities(content.vk, range.start, range.end);
		if (vk.length > 0) {
			partContent.vk = vk;
		}

		const mk = sliceMarkdownEntities(content.mk, range.start, range.end);
		if (mk.length > 0) {
			partContent.mk = mk;
		}

		if (content.cvtt !== undefined) {
			partContent.cvtt = content.cvtt;
		}

		if (contentMentions) {
			const shiftedContentMentions = shiftAtomicEntities(contentMentions, range.start, range.end);
			if (shiftedContentMentions.length > 0) {
				(partContent as IMessageSendPayload & { mentions?: M[] }).mentions = shiftedContentMentions;
			}
		}

		return {
			content: partContent,
			mentions: shiftAtomicEntities(safeMentions, range.start, range.end)
		};
	});
}
