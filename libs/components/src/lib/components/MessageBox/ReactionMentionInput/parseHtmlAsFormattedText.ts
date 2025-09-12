export type ApiMessageEntityDefault = {
	type: Exclude<
		`${ApiMessageEntityTypes}`,
		| `${ApiMessageEntityTypes.Pre}`
		| `${ApiMessageEntityTypes.TextUrl}`
		| `${ApiMessageEntityTypes.MentionName}`
		| `${ApiMessageEntityTypes.CustomEmoji}`
		| `${ApiMessageEntityTypes.Blockquote}`
		| `${ApiMessageEntityTypes.Timestamp}`
		| `${ApiMessageEntityTypes.Hashtag}`
		| `${ApiMessageEntityTypes.MentionRole}`
	>;
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

export type ApiMessageEntityMentionName = {
	type: ApiMessageEntityTypes.MentionName;
	offset: number;
	length: number;
	userId: string;
};

export type ApiMessageEntityMentionTag = {
	type: ApiMessageEntityTypes.Hashtag;
	offset: number;
	length: number;
	id: string;
};

export type ApiMessageEntityMentionRole = {
	type: ApiMessageEntityTypes.MentionRole;
	offset: number;
	length: number;
	role_id: string;
};

export type ApiMessageEntityBlockquote = {
	type: ApiMessageEntityTypes.Blockquote;
	offset: number;
	length: number;
	canCollapse?: boolean;
};

export type ApiMessageEntityCustomEmoji = {
	type: ApiMessageEntityTypes.CustomEmoji;
	offset: number;
	length: number;
	documentId: string;
};

// Local entities
export type ApiMessageEntityTimestamp = {
	type: ApiMessageEntityTypes.Timestamp;
	offset: number;
	length: number;
	timestamp: number;
};

export type ApiMessageEntityQuoteFocus = {
	type: 'quoteFocus';
	offset: number;
	length: number;
};

export type ApiMessageEntity =
	| ApiMessageEntityDefault
	| ApiMessageEntityPre
	| ApiMessageEntityTextUrl
	| ApiMessageEntityMentionName
	| ApiMessageEntityCustomEmoji
	| ApiMessageEntityBlockquote
	| ApiMessageEntityTimestamp
	| ApiMessageEntityQuoteFocus
	| ApiMessageEntityMentionRole
	| ApiMessageEntityMentionTag;

export interface ApiFormattedText {
	text: string;
	entities?: ApiMessageEntity[];
}

export enum ApiMessageEntityTypes {
	Bold = 'MessageEntityBold',
	Blockquote = 'MessageEntityBlockquote',
	BotCommand = 'MessageEntityBotCommand',
	Cashtag = 'MessageEntityCashtag',
	Code = 'MessageEntityCode',
	Email = 'MessageEntityEmail',
	Hashtag = 'MessageEntityHashtag',
	Italic = 'MessageEntityItalic',
	MentionName = 'MessageEntityMentionName',
	MentionRole = 'MessageEntityMentionRole',
	Mention = 'MessageEntityMention',
	Phone = 'MessageEntityPhone',
	Pre = 'MessageEntityPre',
	Strike = 'MessageEntityStrike',
	TextUrl = 'MessageEntityTextUrl',
	Url = 'MessageEntityUrl',
	Underline = 'MessageEntityUnderline',
	Spoiler = 'MessageEntitySpoiler',
	CustomEmoji = 'MessageEntityCustomEmoji',
	Timestamp = 'MessageEntityTimestamp',
	QuoteFocus = 'MessageEntityQuoteFocus',
	Unknown = 'MessageEntityUnknown'
}

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

export const RE_LINK_TEMPLATE =
	'((ftp|https?):\\/\\/)?((www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z][-a-zA-Z0-9]{1,62})\\b([-a-zA-Z0-9()@:%_+.,~#?&/=]*)';

export const IS_EMOJI_SUPPORTED = true;

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
	PRE: ApiMessageEntityTypes.Pre,
	BLOCKQUOTE: ApiMessageEntityTypes.Blockquote
};

const MAX_TAG_DEEPNESS = 3;

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

const LINK_TEMPLATE = /(?:\w+:)?\/\/[^\s<>]+/gi;

export default function parseHtmlAsFormattedText(html: string, withMarkdownLinks = true, skipMarkdown = false): ApiFormattedText {
	const fragment = document.createElement('div');
	fragment.innerHTML = skipMarkdown ? html : withMarkdownLinks ? parseMarkdown(parseMarkdownLinks(html)) : parseMarkdown(html);
	fixImageContent(fragment);
	const text = fragment.innerText.trim().replace(/\u200b+/g, '');
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
			node.textContent = node.alt || '';
		} else {
			node.replaceWith(node.alt || '');
		}
	});
}

function parseMarkdown(html: string) {
	let parsedHtml = html.slice(0);

	parsedHtml = parsedHtml.replace(/&nbsp;/g, ' ');

	parsedHtml = parsedHtml.replace(/<div><br([^>]*)?><\/div>/g, '\n');
	parsedHtml = parsedHtml.replace(/<br([^>]*)?>/g, '\n');

	parsedHtml = parsedHtml.replace(/<\/div>(\s*)<div>/g, '\n');
	parsedHtml = parsedHtml.replace(/<div>/g, '\n');
	parsedHtml = parsedHtml.replace(/<\/div>/g, '');

	// Pre
	parsedHtml = parsedHtml.replace(/`{3}([\s\S]*?)`{3}/g, '<pre>$1</pre>');
	// parsedHtml = parsedHtml.replace(/[`]{3}([^`]+)[`]{3}/g, '<pre>$1</pre>');

	// Code
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[`]{1}([^`\n]+)[`]{1}(?![^<]*<\/(code|pre)>)/g, '<code>$2</code>');

	// Custom Emoji markdown tag
	if (!IS_EMOJI_SUPPORTED) {
		parsedHtml = parsedHtml.replace(/\[<img[^>]+alt="([^"]+)"[^>]*>]/gm, '[$1]');
	}
	parsedHtml = parsedHtml.replace(
		/(?!<(?:code|pre)[^<]*|<\/)\[([^\]\n]+)\]\(customEmoji:(\d+)\)(?![^<]*<\/(?:code|pre)>)/g,
		'<img alt="$1" data-document-id="$2">'
	);

	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[*]{2}([^*\n]+)[*]{2}(?![^<]*<\/(code|pre)>)/g, '<b>$2</b>');
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[_]{2}([^_\n]+)[_]{2}(?![^<]*<\/(code|pre)>)/g, '<i>$2</i>');
	parsedHtml = parsedHtml.replace(/(?!<(code|pre)[^<]*|<\/)[~]{2}([^~\n]+)[~]{2}(?![^<]*<\/(code|pre)>)/g, '<s>$2</s>');
	parsedHtml = parsedHtml.replace(
		/(?!<(code|pre)[^<]*|<\/)[|]{2}([^|\n]+)[|]{2}(?![^<]*<\/(code|pre)>)/g,
		`<span data-entity-type="${ApiMessageEntityTypes.Spoiler}">$2</span>`
	);

	return parsedHtml;
}

// function parseMarkdownLinks(html: string) {
//   return html.replace(new RegExp(`\\[([^\\]]+?)]\\((${RE_LINK_TEMPLATE}+?)\\)`, 'g'), (_, text, link) => {
//     const url = link.includes('://') ? link : link.includes('@') ? `mailto:${link}` : `https://${link}`;
//     return `<a href="${url}">${text}</a>`;
//   });
// }

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
				const decodedMatch = match
					.replace(/&amp;/g, '&')
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&quot;/g, '"')
					.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
					.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

				const { cleanMatch, trailingPunctuation } = getCleanUrlAndTrailing(decodedMatch, partText, offset);
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

function getEntityDataFromNode(node: ChildNode, rawText: string, textIndex: number): { index: number; entity?: ApiMessageEntity } {
	const type = getEntityTypeFromNode(node);

	if (!type || !node.textContent) {
		return {
			index: textIndex,
			entity: undefined
		};
	}

	const rawIndex = rawText.indexOf(node.textContent, textIndex);
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
	if (type === ApiMessageEntityTypes.MentionName) {
		return {
			index,
			entity: {
				type,
				offset,
				length,
				userId: (node as HTMLAnchorElement).dataset.userId!
			}
		};
	}
	if (type === ApiMessageEntityTypes.MentionRole) {
		return {
			index,
			entity: {
				type,
				offset,
				length,
				role_id: (node as HTMLAnchorElement).dataset.userId!
			}
		};
	}

	if (type === ApiMessageEntityTypes.Hashtag) {
		return {
			index,
			entity: {
				type,
				offset,
				length,
				id: (node as HTMLAnchorElement).dataset.id!
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

	if (type === ApiMessageEntityTypes.CustomEmoji) {
		return {
			index,
			entity: {
				type,
				offset,
				length,
				documentId: (node as HTMLImageElement).dataset.documentId!
			}
		};
	}

	if (type === ApiMessageEntityTypes.Timestamp) {
		const timestamp = Number((node as HTMLElement).dataset.timestamp);
		if (Number.isNaN(timestamp)) {
			return {
				index,
				entity: undefined
			};
		}

		return {
			index,
			entity: {
				type,
				offset,
				length,
				timestamp
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
		if (anchor.dataset.entityType === ApiMessageEntityTypes.MentionName) {
			return ApiMessageEntityTypes.MentionName;
		}
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

	if (node.nodeName === 'IMG') {
		if ((node as HTMLImageElement).dataset.documentId) {
			return ApiMessageEntityTypes.CustomEmoji;
		}
	}

	return undefined;
}
