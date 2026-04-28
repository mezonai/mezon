import { sanitizeMessageHtml } from '@mezon/utils';
import { ApiMessageEntityTypes, ENTITY_CLASS_BY_NODE_NAME } from '../parseHtmlAsFormattedText';
import cleanDocsHtml from './cleanDocsHtml';

const STYLE_TAG_REGEX = /<style>(.*?)<\/style>/gs;

export function preparePastedHtml(html: string) {
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
		if (node.tagName === 'BR') node.replaceWith('\n');
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

	return fragment.innerHTML.trim();
}

export function escapeHtml(html: string) {
	const fragment = document.createElement('div');
	const text = document.createTextNode(html);
	fragment.appendChild(text);
	return fragment.innerHTML;
}
