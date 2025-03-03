/* eslint-disable no-useless-escape */
import { isYouTubeLink } from '.';
import { EBacktickType, IMarkdownOnMessage } from '../types';

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
	const text = fragment.innerText;
	const trimShift = fragment.innerText.indexOf(text[0]);
	let textIndex = -trimShift;
	let recursionDeepness = 0;
	const entities: ApiMessageEntity[] = [];

	function addEntity(node: ChildNode) {
		if (node.nodeType === Node.COMMENT_NODE) return;
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
		text,
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
	parsedHtml = parsedHtml.replace(/^`{3}[\n\r]?(.*?)[\n\r]?`{3}/gms, '<pre>$1</pre>');
	parsedHtml = parsedHtml.replace(/[`]{3}([^`]+)[`]{3}/g, '<pre>$1</pre>');

	// Code
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[`]{1}([^`\n]+)[`]{1}(?![^<]*<\/(code|pre)>)/g, '<code>$2</code>');

	// Process bold markdown, but skip mentions
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[*]{2}([^*\n]+)[*]{2}(?![^<]*<\/(code|pre)>)/g, '<b>$2</b>');

	return parsedHtml;
}

const LINK_TEMPLATE =
	/(ftp|http|https):\/\/(((www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z][-a-zA-Z0-9]{1,62})|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?([-a-zA-Z0-9()@:%_+.,~#?&\/=]*)/gi;

function parseMarkdownLinks(html: string) {
	const parts = html.split(/(`{1,3})/);
	let isInCode = false;
	let result = '';
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (part.match(/^`{1,3}$/)) {
			isInCode = !isInCode;
			result += part;
			continue;
		}

		if (isInCode) {
			result += part;
		} else {
			result += part.replace(LINK_TEMPLATE, '<a href="$&" target="_blank">$&</a>');
		}
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
