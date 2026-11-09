import {
	FloatingFocusManager,
	FloatingPortal,
	autoUpdate,
	flip,
	offset,
	shift,
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
	useRole
} from '@floating-ui/react';
import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import type { Editor } from '@tiptap/core';
import { useTranslation } from 'react-i18next';

interface BlockFormatDropdownProps {
	editor: Editor;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

const isParagraph = (ed: Editor) =>
	!ed.isActive('heading') &&
	!ed.isActive('bulletList') &&
	!ed.isActive('orderedList') &&
	!ed.isActive('taskList') &&
	!ed.isActive('blockquote') &&
	!ed.isActive('codeBlock');

export function BlockFormatDropdown({ editor, isOpen, onOpenChange }: BlockFormatDropdownProps) {
	const { t } = useTranslation('canvas');

	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange,
		middleware: [offset(4), flip(), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate
	});

	const click = useClick(context);
	const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true });
	const role = useRole(context, { role: 'menu' });
	const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

	const handleSelect = (action: () => void) => {
		action();
		onOpenChange(false);
	};

	return (
		<>
			<button
				ref={refs.setReference}
				{...getReferenceProps()}
				className={`mz-hover bubble-menu-trigger ${isOpen ? 'is-active' : ''}`}
				title={t('toolbar.blockFormat')}
				aria-label={t('toolbar.blockFormat')}
				aria-expanded={isOpen}
			>
				<MezonIcon icon={MzIcons20.mzParagraph} className="canvas-block-trigger-icon" />
				<span className={`canvas-block-trigger-arrow ${isOpen ? 'rotate-180' : ''}`}>
					<MezonIcon icon={MzIcons16.mzChevronDown} />
				</span>
			</button>

			{isOpen && (
				<FloatingPortal>
					<FloatingFocusManager context={context} modal={false}>
						<div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()} className="canvas-block-dropdown">
							<div className="canvas-block-dropdown-section">
								<button
									type="button"
									className={`canvas-block-dropdown-item ${isParagraph(editor) ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().setParagraph().run())}
								>
									<span className="canvas-block-check-col">
										{isParagraph(editor) && <MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />}
									</span>
									<MezonIcon
										icon={MzIcons16.mzParagraph}
										className={isParagraph(editor) ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
									/>
									<span>{t('blocks.paragraph')}</span>
								</button>
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('heading', { level: 1 }) && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon
										icon={MzIcons16.mzHeading1}
										className={
											editor.isActive('heading', { level: 1 }) ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'
										}
									/>
									<span>{t('blocks.h1')}</span>
								</button>
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('heading', { level: 2 }) && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon
										icon={MzIcons16.mzHeading2}
										className={
											editor.isActive('heading', { level: 2 }) ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'
										}
									/>
									<span>{t('blocks.h2')}</span>
								</button>
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('heading', { level: 3 }) && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon
										icon={MzIcons16.mzHeading3}
										className={
											editor.isActive('heading', { level: 3 }) ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'
										}
									/>
									<span>{t('blocks.h3')}</span>
								</button>
							</div>

							<div className="canvas-block-dropdown-divider" />

							<div className="canvas-block-dropdown-section">
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('taskList') ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleTaskList().run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('taskList') && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon icon={MzIcons16.mzListCheck} className="text-[rgba(7,151,7,1)]" />
									<span>{t('blocks.checkedList')}</span>
								</button>
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('orderedList') ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleOrderedList().run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('orderedList') && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon
										icon={MzIcons16.mzListNumber}
										className={editor.isActive('orderedList') ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
									/>
									<span>{t('blocks.orderedList')}</span>
								</button>
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('bulletList') ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleBulletList().run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('bulletList') && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon
										icon={MzIcons16.mzListBullet}
										className={editor.isActive('bulletList') ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
									/>
									<span>{t('blocks.bulletedList')}</span>
								</button>
								<button
									type="button"
									className={`canvas-block-dropdown-item ${editor.isActive('blockquote') ? 'is-active' : ''}`}
									onClick={() => handleSelect(() => editor.chain().focus().toggleBlockquote().run())}
								>
									<span className="canvas-block-check-col">
										{editor.isActive('blockquote') && (
											<MezonIcon icon={MzIcons16.mzCheck} className="text-[var(--mz-icon-selected)]" />
										)}
									</span>
									<MezonIcon
										icon={MzIcons16.mzQuote}
										className={editor.isActive('blockquote') ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
									/>
									<span>{t('blocks.blockquote')}</span>
								</button>
							</div>
						</div>
					</FloatingFocusManager>
				</FloatingPortal>
			)}
		</>
	);
}
