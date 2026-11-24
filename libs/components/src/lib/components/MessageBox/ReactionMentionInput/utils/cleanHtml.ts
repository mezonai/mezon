import type { MentionDataProps } from '@mezon/utils';
import { escapeInlineStyles, escapeMatchedInlineStyles, sanitizeMessageHtml } from '@mezon/utils';
import { ApiMessageEntityTypes, ENTITY_CLASS_BY_NODE_NAME } from '../parseHtmlAsFormattedText';
import cleanDocsHtml from './cleanDocsHtml';

const STYLE_TAG_REGEX = /<style>(.*?)<\/style>/gs;

let lastComposerCopy = '';

const normalizeClipboardText = (text: string) =>
	text
		.replace(/\r\n?/g, '\n')
		.replace(/[^\S\n]/g, ' ')
		.trim();

export function rememberComposerCopy() {
	lastComposerCopy = normalizeClipboardText(window.getSelection()?.toString() || '');
}

export function shouldKeepPastedText(input: HTMLElement | null, text: string): boolean {
	if (lastComposerCopy && normalizeClipboardText(text) === lastComposerCopy) {
		return true;
	}
	const selection = window.getSelection();
	if (!input || !selection?.rangeCount || !input.contains(selection.getRangeAt(0).startContainer)) {
		return false;
	}
	const range = selection.getRangeAt(0).cloneRange();
	range.collapse(true);
	range.setStart(input, 0);
	const before = document.createElement('div');
	before.appendChild(range.cloneContents());
	before.querySelectorAll('br, div, p').forEach((node) => node.before('\n'));
	const fences = (before.textContent || '').split('```');
	return fences.length % 2 === 0 || (fences[fences.length - 1].split('\n').pop() || '').split('`').length % 2 === 0;
}

export function preparePastedHtml(html: string, escapeText = false) {
	let fragment = document.createElement('div');
	try {
		html = cleanDocsHtml(html);
	} catch (err) {
		console.error(err);
	}
	fragment.innerHTML = sanitizeMessageHtml(html.replace(/\u00a0/g, ' ').replace(STYLE_TAG_REGEX, ''));
	const textContents = fragment.querySelectorAll<HTMLDivElement>('.text-content');
	if (textContents.length) {
		fragment = textContents[textContents.length - 1];
	}

	Array.from(fragment.getElementsByTagName('*')).forEach((node) => {
		if (!(node instanceof HTMLElement)) {
			node.remove();
			return;
		}
		node.removeAttribute('style');
		if (node.tagName === 'BR') node.replaceWith(document.createElement('br'));
		if (node.tagName === 'P') node.appendChild(document.createTextNode('\n'));
		if (node.tagName === 'IMG' && !node.dataset.entityType) node.replaceWith(node.getAttribute('alt') || '');
		if (node.dataset.ignoreOnPaste) node.remove();

		if (ENTITY_CLASS_BY_NODE_NAME[node.tagName]) {
			node.setAttribute('data-entity-type', ENTITY_CLASS_BY_NODE_NAME[node.tagName]);
		}
		if (!node.dataset.entityType && node.textContent === node.innerText) node.replaceWith(node.textContent);
		if (node.dataset.alt) node.setAttribute('alt', node.dataset.alt);
		switch (node.dataset.entityType) {
			case ApiMessageEntityTypes.MentionName:
			case ApiMessageEntityTypes.MentionRole:
			case ApiMessageEntityTypes.Hashtag:
				if (node.dataset.userId && !node.getAttribute('data-user-id')) {
					node.setAttribute('data-user-id', node.dataset.userId);
				}
				if (node.dataset.id && !node.getAttribute('data-id')) {
					node.setAttribute('data-id', node.dataset.id);
				}
				node.setAttribute('contenteditable', 'false');
				break;
			case ApiMessageEntityTypes.CustomEmoji:
				if (node.dataset.documentId && !node.getAttribute('data-document-id')) {
					node.setAttribute('data-document-id', node.dataset.documentId);
				}
				if (node.dataset.alt) {
					node.textContent = node.dataset.alt;
				}
				node.setAttribute('contenteditable', 'false');
				break;
		}
	});

	if (escapeText) {
		fragment.normalize();
		const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			if (!node.parentElement?.closest('code, pre, [contenteditable="false"]')) {
				node.nodeValue = escapeMatchedInlineStyles(node.nodeValue || '');
			}
		}
	}

	return fragment.innerHTML.trim();
}

export function escapeHtml(html: string) {
	const fragment = document.createElement('div');
	const text = document.createTextNode(html);
	fragment.appendChild(text);
	return fragment.innerHTML;
}

type PasteContext = { bold: boolean; italic: boolean; strike: boolean; underline: boolean; link: boolean; code: boolean; keep: boolean };
type PasteRun = { text: string; marker: string; verbatim: boolean };
type PasteToken = PasteRun | 'break' | 'newline';

const PASTE_SKIP_TAGS = new Set([
	'SCRIPT',
	'STYLE',
	'HEAD',
	'TITLE',
	'META',
	'LINK',
	'TEMPLATE',
	'NOSCRIPT',
	'IFRAME',
	'OBJECT',
	'EMBED',
	'CANVAS',
	'BUTTON'
]);
const PASTE_CODE_TAGS = new Set(['CODE', 'KBD', 'SAMP', 'TT']);
const PASTE_BLOCK_TAGS = new Set([
	'ADDRESS',
	'ARTICLE',
	'ASIDE',
	'CAPTION',
	'DD',
	'DIV',
	'DL',
	'DT',
	'FIELDSET',
	'FIGCAPTION',
	'FIGURE',
	'FOOTER',
	'FORM',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'HEADER',
	'HR',
	'MAIN',
	'NAV',
	'OL',
	'P',
	'PRE',
	'SECTION',
	'TABLE',
	'TR',
	'UL'
]);

function joinPasteTokens(tokens: PasteToken[]): string {
	let out = '';
	for (const token of tokens) {
		if (typeof token === 'string') {
			if (token === 'newline' || (out && !out.endsWith('\n'))) {
				out = `${out.replace(/ +$/, '')}\n`;
			}
			continue;
		}
		const close = token.marker.split('').reverse().join('');
		const lines = token.text.split('\n');
		for (let index = 0; index < lines.length; index++) {
			if (index > 0) {
				out = `${out.replace(/ +$/, '')}\n`;
			}
			const [, lead, core, trail] = /^( *)([\s\S]*?)( *)$/.exec(lines[index]) ?? ['', '', lines[index], ''];
			const dropLead = !token.verbatim && (!out || out.endsWith('\n') || out.endsWith(' '));
			out += (dropLead ? '' : lead) + (core && token.marker ? token.marker + core + close : core) + trail;
		}
	}
	return out.replace(/ +$/gm, '').replace(/^\n+|\n+$/g, '');
}

function getPasteLinkUrl(href: string | null): string {
	try {
		const url = new URL((href || '').trim());
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
	} catch {
		return '';
	}
}

export function convertPastedHtmlToMarkdown(html: string): string {
	let formatted = false;

	const pushText = (tokens: PasteToken[], text: string, marker: string, verbatim: boolean) => {
		formatted = formatted || (!!marker && /\S/.test(text));
		const last = tokens[tokens.length - 1];
		if (typeof last === 'object' && last.marker === marker && last.verbatim === verbatim) {
			last.text += text;
		} else {
			tokens.push({ text, marker, verbatim });
		}
	};

	const walk = (node: Node, ctx: PasteContext, tokens: PasteToken[]) => {
		const marker = ctx.code
			? ''
			: (ctx.underline && !ctx.link ? '__' : '') +
				(ctx.bold && ctx.italic ? '***' : ctx.bold ? '**' : ctx.italic ? '*' : '') +
				(ctx.strike ? '~~' : '');
		if (node.nodeType === Node.TEXT_NODE) {
			const value = node.nodeValue || '';
			if (!ctx.keep && !value.trim() && /^(TABLE|THEAD|TBODY|TFOOT|TR|UL|OL)$/.test(node.parentElement?.tagName || '')) {
				return;
			}
			const text = (ctx.keep ? value : value.replace(/[ \t\n\r\f]+/g, ' ')).replace(/\u00a0/g, ' ');
			pushText(tokens, ctx.code ? text : escapeInlineStyles(text), marker, ctx.keep);
			return;
		}
		if (!(node instanceof HTMLElement) || PASTE_SKIP_TAGS.has(node.tagName)) {
			return;
		}

		const tag = node.tagName;
		if (tag === 'BR') {
			tokens.push('newline');
			return;
		}
		if (tag === 'IMG') {
			const alt = node.getAttribute('alt') || '';
			const src = getPasteLinkUrl(node.getAttribute('src'));
			const sizes = ['width', 'height'].filter((size) => node.hasAttribute(size)).map((size) => Number(node.getAttribute(size)));
			const isPixel = sizes.some((size) => size <= 2);
			const isIcon = /^:[\w+-]+:$/.test(alt) || sizes.some((size) => size <= 32);
			if (alt && ((isIcon && !isPixel) || !/[\p{L}\p{N}\s]/u.test(alt))) {
				pushText(tokens, ctx.code ? alt : escapeInlineStyles(alt), marker, false);
			} else if (src && !ctx.code && !ctx.link && !isPixel && !isIcon) {
				pushText(tokens, `![${escapeInlineStyles(alt.replace(/[[\]\s]+/g, ' ').trim())}](${src})`, '', false);
				formatted = true;
			}
			return;
		}
		if (tag === 'HR') {
			tokens.push('break', { text: '---', marker: '', verbatim: true }, 'break');
			formatted = true;
			return;
		}
		if (/mso-list:\s*ignore/i.test(node.getAttribute('style') || '')) {
			const label = (node.textContent || '').trim();
			const level = Number(/level(\d+)/i.exec(node.parentElement?.closest('[style*="mso-list"]')?.getAttribute('style') || '')?.[1]) || 1;
			pushText(tokens, '  '.repeat(level - 1) + (/^\w+[.)]$/.test(label) ? `${label} ` : '- '), '', true);
			formatted = true;
			return;
		}

		const { fontWeight, fontStyle, fontFamily, whiteSpace, textDecorationLine } = node.style;
		const isCodeBlock =
			!ctx.code && (tag === 'PRE' || (PASTE_BLOCK_TAGS.has(tag) && /monospace/i.test(fontFamily) && /^pre|break-spaces/.test(whiteSpace)));
		const isInlineCode = !ctx.code && !isCodeBlock && PASTE_CODE_TAGS.has(tag);
		const next: PasteContext = {
			bold: fontWeight
				? fontWeight === 'bold' || fontWeight === 'bolder' || Number(fontWeight) >= 600
				: ctx.bold || tag === 'B' || tag === 'STRONG',
			italic: fontStyle ? fontStyle !== 'normal' : ctx.italic || tag === 'I' || tag === 'EM',
			strike: ctx.strike || tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || textDecorationLine.includes('line-through'),
			underline: ctx.underline || tag === 'U' || tag === 'INS' || textDecorationLine.includes('underline'),
			link: ctx.link || tag === 'A',
			code: ctx.code || isCodeBlock || isInlineCode,
			keep: tag === 'PRE' || (whiteSpace ? /^pre|break-spaces/.test(whiteSpace) : ctx.keep)
		};
		const walkChildren = (target: PasteToken[]) => node.childNodes.forEach((child) => walk(child, next, target));

		if (isCodeBlock || isInlineCode) {
			const inner: PasteToken[] = [];
			walkChildren(inner);
			const code = joinPasteTokens(inner);
			if (isCodeBlock && code) {
				tokens.push('break', { text: `\`\`\`\n${code}\n\`\`\``, marker: '', verbatim: true }, 'break');
				formatted = true;
			} else if (code.trim() && !/[`\n]/.test(code)) {
				pushText(tokens, `\`${code}\``, '', false);
				formatted = true;
			} else {
				pushText(tokens, escapeInlineStyles(code), '', false);
			}
			return;
		}

		if (tag === 'A') {
			const rawHref = (node.getAttribute('href') || '').trim();
			const href = getPasteLinkUrl(rawHref);
			const label = (node.textContent || '').trim();
			const stripUrl = (value: string) => value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
			if (href && label && stripUrl(label) === stripUrl(rawHref)) {
				pushText(tokens, /^https?:\/\//i.test(label) ? label : href, '', false);
				return;
			}
			const isNamed = !/[[\]]/.test(label);
			if (href && label && isNamed) {
				pushText(tokens, '[', '', false);
			}
			walkChildren(tokens);
			if (href && label) {
				pushText(tokens, isNamed ? `](${href})` : ` (${href}) `, '', false);
				formatted = true;
			}
			return;
		}

		if (/^H[1-6]$/.test(tag)) {
			const inner: PasteToken[] = [];
			walkChildren(inner);
			const unstyled = inner.map((token) => (typeof token === 'object' ? { ...token, marker: '' } : token));
			const text = joinPasteTokens(unstyled).replace(/\s*\n\s*/g, ' ');
			if (text) {
				tokens.push('break', { text: `${'#'.repeat(Number(tag[1]))} ${text}`, marker: '', verbatim: true }, 'break');
				formatted = true;
			}
			return;
		}

		if (tag === 'LI' || tag === 'BLOCKQUOTE') {
			const inner: PasteToken[] = [];
			walkChildren(inner);
			const list = node.parentElement;
			const checkbox = Array.from(node.querySelectorAll('input[type="checkbox"]')).find((input) => input.closest('li') === node);
			const checked = tag === 'LI' ? (node.getAttribute('aria-checked') ?? (checkbox ? String(checkbox.hasAttribute('checked')) : null)) : null;
			const marker =
				tag === 'BLOCKQUOTE'
					? '> '
					: list?.tagName === 'OL' && checked === null
						? `${
								(Number(list.getAttribute('start')) || 1) +
								Array.from(list.children)
									.filter((item) => item.tagName === 'LI')
									.indexOf(node)
							}. `
						: '- ';
			const bullet = marker + (checked === null ? '' : checked === 'true' ? '[x] ' : '[ ] ');
			const lines = joinPasteTokens(inner).split('\n');
			const text = lines.map((line, index) => (index && tag === 'LI' ? ' '.repeat(marker.length) : bullet) + line).join('\n');
			tokens.push('break', { text, marker: '', verbatim: true }, 'break');
			formatted = true;
			return;
		}

		if (node instanceof HTMLTableElement && !node.querySelector('table')) {
			const rows = Array.from(node.rows).map((row) =>
				Array.from(row.cells).map((cell) => {
					const inner: PasteToken[] = [];
					cell.childNodes.forEach((child) => walk(child, next, inner));
					return joinPasteTokens(inner)
						.replace(/\s*\n\s*/g, ' ')
						.replace(/(?<!\\)\|/g, '\\|');
				})
			);
			const columns = Math.max(0, ...rows.map((row) => row.length));
			if (rows.length > 1 && columns > 1) {
				const toLine = (cells: string[]) => `| ${Array.from({ length: columns }, (_, idx) => cells[idx] || ' ').join(' | ')} |`;
				const table = [toLine(rows[0]), toLine(Array(columns).fill('---')), ...rows.slice(1).map(toLine)].join('\n');
				tokens.push('break', { text: table, marker: '', verbatim: true }, 'break');
				formatted = true;
				return;
			}
		}
		if ((tag === 'TD' || tag === 'TH') && node.previousElementSibling) {
			pushText(tokens, '\t', '', true);
		}
		const isBlock = PASTE_BLOCK_TAGS.has(tag);
		if (isBlock && node.textContent?.includes('\u00a0') && !node.textContent.trim()) {
			tokens.push('break', 'newline');
			return;
		}
		if (isBlock) {
			tokens.push('break');
		}
		walkChildren(tokens);
		if (isBlock) {
			tokens.push('break');
		}
	};

	const tokens: PasteToken[] = [];
	const body = new DOMParser().parseFromString(html, 'text/html').body;
	body.querySelectorAll('ul > ul, ul > ol, ol > ul, ol > ol').forEach((list) => {
		const item = list.previousElementSibling;
		if (item?.tagName === 'LI') {
			item.appendChild(list);
		}
	});
	walk(body, { bold: false, italic: false, strike: false, underline: false, link: false, code: false, keep: false }, tokens);
	const text = joinPasteTokens(tokens);
	return formatted && !/^(`[^`\n]*`|```\n[^\n]*\n```)$/.test(text) ? text : '';
}

const normalizeMentionName = (name: string) => name.trim().replace(/^@/, '').normalize('NFC').toLocaleLowerCase();

export const clearMentionReplacer = (html: string, users: MentionDataProps[] = []) => {
	const doc = new DOMParser().parseFromString(html, 'text/html');

	doc.querySelectorAll('a[data-entity-type="MessageEntityMentionName"][data-user-id]').forEach((element) => {
		const userId = element.getAttribute('data-user-id');
		const pastedName = normalizeMentionName(element.textContent ?? '');
		const matchedUser = users.find((user) => String(user.id) === userId);
		const knownNames = [matchedUser?.clanNick, matchedUser?.displayName, matchedUser?.username].filter((name): name is string => !!name?.trim());
		const shouldKeepMention = knownNames.some((name) => pastedName === normalizeMentionName(name));

		if (!shouldKeepMention) {
			element.replaceWith(doc.createTextNode(element.textContent ?? ''));
		}
	});

	return doc.body.innerHTML;
};
