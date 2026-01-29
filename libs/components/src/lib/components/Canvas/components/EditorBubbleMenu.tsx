import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockFormatDropdown } from './BlockFormatDropdown';
import { LinkPopover } from './LinkPopover';

interface EditorBubbleMenuProps {
	editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
	const { t } = useTranslation('canvas');
	const [blockDropdownOpen, setBlockDropdownOpen] = useState(false);
	const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

	const handleBlockDropdownChange = (open: boolean) => {
		setBlockDropdownOpen(open);
		if (open) setLinkPopoverOpen(false);
	};

	const handleLinkPopoverChange = (open: boolean) => {
		setLinkPopoverOpen(open);
		if (open) setBlockDropdownOpen(false);
	};

	return (
		<BubbleMenu className="bubble-menu" editor={editor}>
			<BlockFormatDropdown editor={editor} isOpen={blockDropdownOpen} onOpenChange={handleBlockDropdownChange} />

			<button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
				<strong>B</strong>
			</button>
			<button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
				<em>I</em>
			</button>
			<button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>
				<s>S</s>
			</button>

			<span className="separator" />

			<button
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				className={editor.isActive('codeBlock') ? 'is-active' : ''}
				title={t('toolbar.codeBlock')}
			>
				&lt;/&gt;
			</button>

			<span className="separator" />

			<LinkPopover editor={editor} isOpen={linkPopoverOpen} onOpenChange={handleLinkPopoverChange} />
		</BubbleMenu>
	);
}
