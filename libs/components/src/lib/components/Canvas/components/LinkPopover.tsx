import {
    FloatingFocusManager,
    FloatingPortal,
    autoUpdate,
    flip,
    offset,
    shift,
    useDismiss,
    useFloating,
    useInteractions,
    useRole
} from '@floating-ui/react';
import { Icons } from '@mezon/ui';
import type { Editor } from '@tiptap/core';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LinkPopoverProps {
	editor: Editor;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LinkPopover({ editor, isOpen, onOpenChange }: LinkPopoverProps) {
	const { t } = useTranslation('canvas');
	const [linkUrl, setLinkUrl] = useState('');

	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange,
		middleware: [offset(6), flip(), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate
	});

	const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true });
	const role = useRole(context, { role: 'dialog' });
	const { getFloatingProps } = useInteractions([dismiss, role]);

	const openPopover = useCallback(() => {
		setLinkUrl(editor.getAttributes('link').href || '');
		onOpenChange(true);
	}, [editor, onOpenChange]);

	const applyLink = useCallback(() => {
		const href = linkUrl.trim();
		if (href) {
			editor.chain().focus().setLink({ href }).run();
		} else {
			editor.chain().focus().unsetLink().run();
		}
		onOpenChange(false);
		setLinkUrl('');
	}, [editor, linkUrl, onOpenChange]);

	const cancelPopover = useCallback(() => {
		onOpenChange(false);
		setLinkUrl('');
	}, [onOpenChange]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') applyLink();
			if (e.key === 'Escape') cancelPopover();
		},
		[applyLink, cancelPopover]
	);

	return (
		<>
			<button
				ref={refs.setReference}
				onClick={openPopover}
				className={editor.isActive('link') ? 'is-active' : ''}
				title={t('toolbar.addLink')}
				aria-label={t('toolbar.addLink')}
			>
				<Icons.CopyMessageLinkRightClick defaultSize="w-4 h-4" />
			</button>

			{editor.isActive('link') && (
				<button
					onClick={() => editor.chain().focus().unsetLink().run()}
					title={t('toolbar.removeLink')}
					aria-label={t('toolbar.removeLink')}
				>
					<Icons.Close defaultSize="w-4 h-4" />
				</button>
			)}

			{isOpen && (
				<FloatingPortal>
					<FloatingFocusManager context={context} modal={false}>
						<div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()} className="canvas-link-popover">
							<input
								type="url"
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="https://..."
								className="canvas-link-popover-input"
								autoFocus
							/>
							<div className="canvas-link-popover-actions">
								<button type="button" onClick={cancelPopover} className="canvas-link-popover-btn canvas-link-popover-btn-cancel">
									{t('toolbar.cancel')}
								</button>
								<button type="button" onClick={applyLink} className="canvas-link-popover-btn canvas-link-popover-btn-apply">
									{t('toolbar.apply')}
								</button>
							</div>
						</div>
					</FloatingFocusManager>
				</FloatingPortal>
			)}
		</>
	);
}
