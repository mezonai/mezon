interface QuillDelta {
	ops: QuillOp[];
}

interface QuillOp {
	insert?: string | { image?: string };
	attributes?: QuillAttributes;
}

interface QuillAttributes {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strike?: boolean;
	link?: string;
	header?: number;
	list?: 'bullet' | 'ordered';
	color?: string;
}

interface TiptapNode {
	type: string;
	content?: TiptapNode[];
	text?: string;
	marks?: TiptapMark[];
	attrs?: Record<string, unknown>;
}

interface TiptapMark {
	type: string;
	attrs?: Record<string, unknown>;
}

export function isQuillDeltaFormat(content: unknown): content is QuillDelta {
	if (!content || typeof content !== 'object') return false;
	const obj = content as Record<string, unknown>;
	return Array.isArray(obj.ops) && obj.ops.length > 0;
}

export function convertQuillDeltaToTiptap(delta: QuillDelta): TiptapNode {
	const doc: TiptapNode = {
		type: 'doc',
		content: []
	};

	let currentParagraph: TiptapNode = { type: 'paragraph', content: [] };
	let currentList: TiptapNode | null = null;
	let currentListType: 'bulletList' | 'orderedList' | null = null;

	const flushParagraph = () => {
		if (currentParagraph.content && currentParagraph.content.length > 0) {
			if (currentList) {
				const listItem: TiptapNode = {
					type: 'listItem',
					content: [currentParagraph]
				};
				currentList.content = currentList.content || [];
				currentList.content.push(listItem);
			} else {
				doc.content?.push(currentParagraph);
			}
		}
		currentParagraph = { type: 'paragraph', content: [] };
	};

	const flushList = () => {
		if (currentList && currentList.content && currentList.content.length > 0) {
			doc.content?.push(currentList);
		}
		currentList = null;
		currentListType = null;
	};

	for (const op of delta.ops) {
		if (typeof op.insert === 'object' && op.insert.image) {
			flushParagraph();
			flushList();
			doc.content?.push({
				type: 'image',
				attrs: { src: op.insert.image }
			});
			continue;
		}

		if (typeof op.insert !== 'string') continue;

		const text = op.insert;
		const attrs = op.attributes || {};

		if (text === '\n') {
			if (attrs.header) {
				const headingContent = currentParagraph.content || [];
				if (headingContent.length > 0) {
					flushList();
					doc.content?.push({
						type: 'heading',
						attrs: { level: attrs.header },
						content: headingContent
					});
					currentParagraph = { type: 'paragraph', content: [] };
				}
				continue;
			}

			if (attrs.list) {
				const listType = attrs.list === 'ordered' ? 'orderedList' : 'bulletList';

				if (currentListType !== listType) {
					flushList();
					currentList = { type: listType, content: [] };
					currentListType = listType;
				}

				flushParagraph();
				continue;
			}

			flushParagraph();
			flushList();
			continue;
		}

		const lines = text.split('\n');
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line) {
				const textNode: TiptapNode = { type: 'text', text: line };
				const marks: TiptapMark[] = [];

				if (attrs.bold) marks.push({ type: 'bold' });
				if (attrs.italic) marks.push({ type: 'italic' });
				if (attrs.underline) marks.push({ type: 'underline' });
				if (attrs.strike) marks.push({ type: 'strike' });
				if (attrs.link) marks.push({ type: 'link', attrs: { href: attrs.link } });

				if (marks.length > 0) {
					textNode.marks = marks;
				}

				currentParagraph.content = currentParagraph.content || [];
				currentParagraph.content.push(textNode);
			}

			if (i < lines.length - 1) {
				flushParagraph();
				flushList();
			}
		}
	}

	flushParagraph();
	flushList();

	if (!doc.content || doc.content.length === 0) {
		doc.content = [{ type: 'paragraph' }];
	}

	return doc;
}
