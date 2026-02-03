import { handleUploadFile, useMezon } from '@mezon/transport';
import { fileTypeImage } from '@mezon/utils';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './CanvasEditor.scss';
import { EditorBubbleMenu } from './components';
import type { CanvasEditorProps } from './types';
import { convertQuillDeltaToTiptap, isQuillDeltaFormat } from './utils/quillConverter';

export function CanvasEditor({ content, editable, onChange }: CanvasEditorProps) {
	const { t } = useTranslation('canvas');
	const containerRef = useRef<HTMLDivElement>(null);
	const isSettingContent = useRef(false);
	const lastContentRef = useRef('');
	const isInitialized = useRef(false);

	const { sessionRef, clientRef } = useMezon();

	const uploadingText = t('editor.uploadingImage');

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] }
			}),
			Image,
			Link.configure({ openOnClick: false }),
			TaskList,
			TaskItem.configure({
				nested: true
			}),
			Underline,
			Placeholder.configure({
				placeholder: t('editor.placeholder')
			})
		],
		editable,
		content: '',
		onUpdate: ({ editor }) => {
			if (isSettingContent.current) return;
			const json = JSON.stringify(editor.getJSON());
			lastContentRef.current = json;
			onChange(json);
		}
	});

	useEffect(() => {
		if (!editor) return;
		if (content === lastContentRef.current) return;

		isSettingContent.current = true;

		try {
			const parsed = JSON.parse(content);
			if (isQuillDeltaFormat(parsed)) {
				const tiptapContent = convertQuillDeltaToTiptap(parsed);
				editor.commands.setContent(tiptapContent);
			} else {
				editor.commands.setContent(parsed);
			}
		} catch {
			if (content) {
				editor.commands.setContent(content);
			}
		}

		lastContentRef.current = content;
		isSettingContent.current = false;
		isInitialized.current = true;
	}, [content, editor]);

	useEffect(() => {
		if (editor) {
			editor.setEditable(editable);
		}
	}, [editor, editable]);

	const uploadImage = useCallback(
		async (file: File): Promise<string | null> => {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session || !fileTypeImage.includes(file.type)) {
				return null;
			}

			try {
				const attachment = await handleUploadFile(client, session, file.name || `image-${Date.now()}.png`, file);
				return attachment.url || null;
			} catch {
				return null;
			}
		},
		[sessionRef, clientRef]
	);

	const handlePaste = useCallback(
		async (e: ClipboardEvent) => {
			if (!editor || !editable) return;

			const items = e.clipboardData?.items;
			if (!items) return;

			let imageFile: File | null = null;
			for (let i = 0; i < items.length; i++) {
				if (items[i].type.startsWith('image/')) {
					imageFile = items[i].getAsFile();
					break;
				}
			}

			if (!imageFile) return;

			e.preventDefault();
			e.stopPropagation();

			const { from } = editor.state.selection;
			editor.chain().focus().insertContentAt(from, { type: 'text', text: uploadingText }).run();

			const url = await uploadImage(imageFile);

			if (url) {
				editor
					.chain()
					.focus()
					.deleteRange({ from, to: from + uploadingText.length })
					.setImage({ src: url })
					.run();
			} else {
				editor
					.chain()
					.focus()
					.deleteRange({ from, to: from + uploadingText.length })
					.run();
			}
		},
		[editor, editable, uploadImage, uploadingText]
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		container.addEventListener('paste', handlePaste);
		return () => container.removeEventListener('paste', handlePaste);
	}, [handlePaste]);

	if (!editor) return null;

	return (
		<div ref={containerRef} className="canvas-editor-container">
			{editable && <EditorBubbleMenu editor={editor} />}
			<EditorContent editor={editor} className="canvas-editor" />
		</div>
	);
}
