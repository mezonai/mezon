/* eslint-disable no-useless-escape */
import { MentionItem } from 'react-mentions';
import { isYouTubeLink } from '.';
import { EBacktickType, ETypeMEntion, IMarkdownOnMessage } from '../types';

export enum ApiMessageEntityTypes {
	Bold = 'MessageEntityBold',
	BotCommand = 'MessageEntityBotCommand',
	Cashtag = 'MessageEntityCashtag',
	Code = 'MessageEntityCode',
	Email = 'MessageEntityEmail',
	Italic = 'MessageEntityItalic',
	Phone = 'MessageEntityPhone',
	Pre = 'MessageEntityPre',
	Strike = 'MessageEntityStrike',
	TextUrl = 'MessageEntityTextUrl',
	Url = 'MessageEntityUrl',
	Underline = 'MessageEntityUnderline',
	Spoiler = 'MessageEntitySpoiler',
	Unknown = 'MessageEntityUnknown'
}

export type ApiMessageEntityDefault = {
	type: Exclude<`${ApiMessageEntityTypes}`, `${ApiMessageEntityTypes.Pre}` | `${ApiMessageEntityTypes.TextUrl}`>;
	offset: number;
	length: number;
};

export type ApiMessageEntityPre = {
	type: ApiMessageEntityTypes.Pre;
	offset: number;
	length: number;
	language?: string;
};

export type ApiMessageEntityTextUrl = {
	type: ApiMessageEntityTypes.TextUrl;
	offset: number;
	length: number;
	url: string;
};

export type ApiMessageEntity = ApiMessageEntityDefault | ApiMessageEntityPre | ApiMessageEntityTextUrl;

export interface ApiFormattedText {
	text: string;
	entities?: ApiMessageEntity[];
}

export const ENTITY_CLASS_BY_NODE_NAME: Record<string, ApiMessageEntityTypes> = {
	B: ApiMessageEntityTypes.Bold,
	STRONG: ApiMessageEntityTypes.Bold,
	I: ApiMessageEntityTypes.Italic,
	EM: ApiMessageEntityTypes.Italic,
	INS: ApiMessageEntityTypes.Underline,
	U: ApiMessageEntityTypes.Underline,
	S: ApiMessageEntityTypes.Strike,
	STRIKE: ApiMessageEntityTypes.Strike,
	DEL: ApiMessageEntityTypes.Strike,
	CODE: ApiMessageEntityTypes.Code,
	PRE: ApiMessageEntityTypes.Pre
};

const MAX_TAG_DEEPNESS = 3;

export function escapeHtml(html: string) {
	const parts = html.split(/(<a\b[^>]*>.*?<\/a>)/gi);
	const fragment = document.createElement('div');

	parts.forEach((part) => {
		if (!part) return;

		if (part.startsWith('<a')) {
			const temp = document.createElement('div');
			temp.innerHTML = part;
			fragment.appendChild(temp.firstChild!);
		} else {
			// Escape non-link content
			const text = document.createTextNode(part);
			fragment.appendChild(text);
		}
	});

	return fragment.innerHTML;
}

export function parseHtmlAsFormattedText(html: string): ApiFormattedText {
	const fragment = document.createElement('div');
	fragment.innerHTML = parseMarkdown(escapeHtml(parseMarkdownLinks(html)));

	fixImageContent(fragment);
	const text = fragment.innerText.replace(/___#new_line___/g, '\n');
	const trimShift = text.indexOf(text[0]);
	let textIndex = -trimShift;
	let recursionDeepness = 0;
	const entities: ApiMessageEntity[] = [];

	function addEntity(node: ChildNode) {
		if (node.nodeType === Node.COMMENT_NODE) return;
		node.textContent = node.textContent?.replace(/___#new_line___/g, '\n') || '';
		const { index, entity } = getEntityDataFromNode(node, text, textIndex);

		if (entity) {
			textIndex = index;
			entities.push(entity);
		} else if (node.textContent) {
			// Skip newlines on the beginning
			if (index === 0 && node.textContent.trim() === '') {
				return;
			}
			textIndex += node.textContent.length;
		}

		if (node.hasChildNodes() && recursionDeepness <= MAX_TAG_DEEPNESS) {
			recursionDeepness += 1;
			Array.from(node.childNodes).forEach(addEntity);
		}
	}

	Array.from(fragment.childNodes).forEach((node) => {
		recursionDeepness = 1;
		addEntity(node);
	});

	return {
		text: !entities.length && !text ? html : text,
		entities: entities.length ? entities : undefined
	};
}

export function fixImageContent(fragment: HTMLDivElement) {
	fragment.querySelectorAll('img').forEach((node) => {
		if (node.dataset.documentId) {
			// Custom Emoji
			node.textContent = (node as HTMLImageElement).alt || '';
		} else {
			// Regular emoji with image fallback
			node.replaceWith(node.alt || '');
		}
	});
}

function parseMarkdown(html: string) {
	let parsedHtml = html.slice(0);

	// Define a regex to match mentions

	// Strip redundant nbsp's
	parsedHtml = parsedHtml.replace(/&nbsp;/g, ' ');

	// Replace <div><br></div> with newline (new line in Safari)
	parsedHtml = parsedHtml.replace(/<div><br([^>]*)?><\/div>/g, '\n');
	// Replace <br> with newline
	parsedHtml = parsedHtml.replace(/<br([^>]*)?>/g, '\n');

	// Strip redundant <div> tags
	parsedHtml = parsedHtml.replace(/<\/div>(\s*)<div>/g, '\n');
	parsedHtml = parsedHtml.replace(/<div>/g, '\n');
	parsedHtml = parsedHtml.replace(/<\/div>/g, '');

	// Pre
	parsedHtml = parsedHtml.replace(/`{3}([\s\S]*?)`{3}/g, function (match, p1) {
		return '<pre>' + p1.replace(/\n/g, '___#new_line___') + '</pre>';
	});

	// parsedHtml = parsedHtml.replace(/^`{3}[\n\r]?(.*?)[\n\r]?`{3}/gms, '<pre>$1</pre>');
	// parsedHtml = parsedHtml.replace(/[`]{3}([^`]+)[`]{3}/g, '<pre>$1</pre>');

	// Code
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[`]{1}([^`\n]+)[`]{1}(?![^<]*<\/(code|pre)>)/g, '<code>$2</code>');

	// Process bold markdown, but skip mentions
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[*]{2}([^*]*?)[*]{2}(?![^<]*<\/(code|pre)>)/g, '<b>$2</b>');

	return parsedHtml;
}

const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
const localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

function isUrl(string: string): boolean {
	if (typeof string !== 'string') {
		return false;
	}

	const match = string.match(protocolAndDomainRE);
	if (!match) {
		return false;
	}

	const everythingAfterProtocol = match[1];
	if (!everythingAfterProtocol) {
		return false;
	}

	if (localhostDomainRE.test(everythingAfterProtocol) || nonLocalhostDomainRE.test(everythingAfterProtocol)) {
		return true;
	}

	return false;
}

function getCleanUrlAndTrailing(match: string, fullText: string, matchIndex: number): { cleanMatch: string; trailingPunctuation: string } {
	const beforeMatch = fullText.substring(0, matchIndex);

	const wrappingPairs = [
		{ open: '(', close: ')' },
		{ open: '[', close: ']' },
		{ open: '{', close: '}' },
		{ open: '<', close: '>' }
	];

	let cleanMatch = match;
	let trailingPunctuation = '';

	let isWrapped = false;
	for (const pair of wrappingPairs) {
		if (beforeMatch.endsWith(pair.open) && match.endsWith(pair.close)) {
			cleanMatch = match.slice(0, -1);
			trailingPunctuation = pair.close;
			isWrapped = true;
			break;
		}
	}

	if (!isWrapped) {
		const commonTrailingPunctuation = /[.,;:!?'"]+$/;
		const trailingMatch = match.match(commonTrailingPunctuation);
		if (trailingMatch) {
			cleanMatch = match.slice(0, -trailingMatch[0].length);
			trailingPunctuation = trailingMatch[0];
		}
	}

	return { cleanMatch, trailingPunctuation };
}

const LINK_TEMPLATE = /(?:\w+:)?\/\/\S+/gi;

function parseMarkdownLinks(html: string) {
	if (!html || html.length === 0) return html;

	const codeSections: string[] = [];
	let result = html;

	result = result.replace(/```[\s\S]*?```/g, (match) => {
		const index = codeSections.length;
		codeSections.push(match);
		return `__CODE_BLOCK_${index}__`;
	});

	result = result.replace(/`[^`\n]+`/g, (match) => {
		if (match.includes('__CODE_BLOCK_')) {
			return match;
		}

		const index = codeSections.length;
		codeSections.push(match);
		return `__INLINE_CODE_${index}__`;
	});

	const placeholderRegex = /__(?:CODE_BLOCK|INLINE_CODE)_\d+__/g;
	const parts = result.split(placeholderRegex);
	const placeholders = result.match(placeholderRegex) || [];

	for (let i = 0; i < parts.length; i++) {
		if (parts[i]) {
			const partText = parts[i];
			parts[i] = partText.replace(LINK_TEMPLATE, (match, offset) => {
				const { cleanMatch, trailingPunctuation } = getCleanUrlAndTrailing(match, partText, offset);
				if (isUrl(cleanMatch)) {
					return `<a href="${cleanMatch}" target="_blank">${cleanMatch}</a>${trailingPunctuation}`;
				}
				return match;
			});
		}
	}

	result = '';
	for (let i = 0; i < parts.length; i++) {
		result += parts[i];
		if (i < placeholders.length) {
			result += placeholders[i];
		}
	}

	if (codeSections.length > 0) {
		result = result.replace(/__(?:CODE_BLOCK|INLINE_CODE)_(\d+)__/g, (match, index) => {
			return codeSections[parseInt(index, 10)] || match;
		});
	}

	return result;
}

function getEntityDataFromNode(node: ChildNode, rawText: string, textIndex: number): { index: number; entity?: any } {
	const type = getEntityTypeFromNode(node);

	if (!type || !node.textContent) {
		return {
			index: textIndex,
			entity: undefined
		};
	}

	const rawIndex = rawText.indexOf(node.textContent, textIndex);
	// In some cases, last text entity ends with a newline (which gets trimmed from `rawText`).
	// In this case, `rawIndex` would return `-1`, so we use `textIndex` instead.
	const index = rawIndex >= 0 ? rawIndex : textIndex;
	const offset = rawText.substring(0, index).length;
	const { length } = rawText.substring(index, index + node.textContent.length);

	if (type === ApiMessageEntityTypes.TextUrl) {
		return {
			index,
			entity: {
				type,
				offset,
				length,
				url: (node as HTMLAnchorElement).href
			}
		};
	}

	if (type === ApiMessageEntityTypes.Pre) {
		return {
			index,
			entity: {
				type,
				offset,
				length,
				language: (node as HTMLPreElement).dataset.language
			}
		};
	}

	return {
		index,
		entity: {
			type,
			offset,
			length
		}
	};
}

function getEntityTypeFromNode(node: ChildNode): ApiMessageEntityTypes | undefined {
	if (node instanceof HTMLElement && node.dataset.entityType) {
		return node.dataset.entityType as ApiMessageEntityTypes;
	}

	if (ENTITY_CLASS_BY_NODE_NAME[node.nodeName]) {
		return ENTITY_CLASS_BY_NODE_NAME[node.nodeName];
	}

	if (node.nodeName === 'A') {
		const anchor = node as HTMLAnchorElement;
		if (anchor.dataset.entityType === ApiMessageEntityTypes.Url) {
			return ApiMessageEntityTypes.Url;
		}
		if (anchor.href.startsWith('mailto:')) {
			return ApiMessageEntityTypes.Email;
		}
		if (anchor.href.startsWith('tel:')) {
			return ApiMessageEntityTypes.Phone;
		}
		if (anchor.href !== anchor.textContent) {
			return ApiMessageEntityTypes.TextUrl;
		}

		return ApiMessageEntityTypes.Url;
	}

	if (node.nodeName === 'SPAN') {
		return (node as HTMLElement).dataset.entityType as any;
	}

	return undefined;
}

const ENTITY_TYPE_TO_BACKTICK_MAP = {
	[ApiMessageEntityTypes.Code]: EBacktickType.CODE,
	[ApiMessageEntityTypes.Pre]: EBacktickType.PRE,
	[ApiMessageEntityTypes.Bold]: EBacktickType.BOLD
};

export const processMarkdownEntities = (text: string | undefined, entities: ApiMessageEntity[] | undefined): IMarkdownOnMessage[] => {
	if (!entities) return [];

	const entityMap = new Map<string, ApiMessageEntity>();

	entities.forEach((entity) => {
		const key = `${entity.offset + entity.length}-${entity.offset}`;
		if (
			!entityMap.has(key) ||
			entity.type === ApiMessageEntityTypes.Pre ||
			entity.type === ApiMessageEntityTypes.Url ||
			entity.type === ApiMessageEntityTypes.TextUrl
		) {
			entityMap.set(key, entity);
		}
	});

	const filteredEntities = Array.from(entityMap.values());
	return filteredEntities
		.map((entity) => {
			if (entity.type === ApiMessageEntityTypes.Url || entity.type === ApiMessageEntityTypes.TextUrl) {
				const link = text?.substring(entity.offset, entity.offset + entity.length);
				return {
					type: link?.startsWith('https://meet.google.com/')
						? EBacktickType.VOICE_LINK
						: isYouTubeLink(text as string)
							? EBacktickType.LINKYOUTUBE
							: EBacktickType.LINK,
					e: entity.offset + entity.length,
					s: entity.offset
				};
			}

			const backtickType = (ENTITY_TYPE_TO_BACKTICK_MAP as any)[entity.type];
			if (!backtickType) return null;

			return {
				type: backtickType,
				e: entity.offset + entity.length,
				s: entity.offset
			};
		})
		.filter(Boolean) as IMarkdownOnMessage[];
};

export const processBoldEntities = (entities: MentionItem[], markdown: IMarkdownOnMessage[]) => {
	const boldMarkdownArr: IMarkdownOnMessage[] = [];

	let indexMark = 0;
	let markLength = 0;
	const rawMentionsSort = [...(entities || [])].sort((a, b) => a.plainTextIndex - b.plainTextIndex);
	for (let i = 0; i < rawMentionsSort.length; i++) {
		const mention = rawMentionsSort[i];
		const mark = markdown[indexMark];

		if (mark && mention.plainTextIndex - markLength > (mark.s || 0)) {
			switch (mark.type) {
				case EBacktickType.CODE:
					markLength += 2;
					break;
				case EBacktickType.PRE:
					markLength += 6;
					break;
				default:
			}
			indexMark += 1;
			i--;
			continue;
		}

		if (mention.childIndex === ETypeMEntion.BOLD) {
			boldMarkdownArr.push({
				type: EBacktickType.BOLD,
				s: mention.plainTextIndex - markLength,
				e: mention.plainTextIndex + mention.display.length - markLength
			});
		}
	}
	return boldMarkdownArr;
};

