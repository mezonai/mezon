import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

const MESSAGE_HTML_CONFIG: Config = {
	ALLOWED_TAGS: [
		'a',
		'b',
		'strong',
		'i',
		'em',
		'u',
		'ins',
		's',
		'strike',
		'del',
		'code',
		'pre',
		'p',
		'br',
		'span',
		'div',
		'img',
		'ul',
		'ol',
		'li',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'blockquote'
	],
	ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'alt', 'class', 'id', 'contenteditable'],
	ALLOW_DATA_ATTR: true
};


export function sanitizeMessageHtml(html: string): string {
	if (!html) {
		return html;
	}
	if (typeof window === 'undefined') {
		return html;
	}
	return DOMPurify.sanitize(html, MESSAGE_HTML_CONFIG);
}
