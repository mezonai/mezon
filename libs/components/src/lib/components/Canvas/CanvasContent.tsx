import { canvasActions, selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { safeJSONParse } from 'mezon-js';
import type { Delta } from 'quill';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CanvasFormatType, QuillCodeBlockValue, QuillHeaderValue, QuillListValue, handlePaste, preventBase64Images } from './canvasPasteUtils';

interface ActiveFormats {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
	'code-block': boolean;
	link: string;
	h1: boolean;
	h2: boolean;
	h3: boolean;
	paragraph: boolean;
	check: boolean;
	ordered: boolean;
	bullet: boolean;
	blockquote: boolean;
	image: string;
}

type CanvasContentProps = {
	isLightMode: boolean;
	content: string;
	idCanvas: string;
	isEditAndDelCanvas: boolean;
	onCanvasChange?: () => void;
};

function CanvasContent({ isLightMode, content, idCanvas, isEditAndDelCanvas, onCanvasChange }: CanvasContentProps) {
	const [toolbarVisible, setToolbarVisible] = useState(false);
	const quillRef = useRef<Quill | null>(null);
	const editorRef = useRef<HTMLDivElement | null>(null);
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const hasSetInitialContent = useRef(false);
	const dispatch = useDispatch();
	const [quill, setQuill] = useState<Quill | null>(null);

	const { sessionRef, clientRef } = useMezon();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const currentChannelId = useSelector(selectCurrentChannelId) || '';
	const placeholderColor = 'var(--text-theme-primary)';
	const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

	const [activeOption, setActiveOption] = useState(CanvasFormatType.PARAGRAPH);

	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);
	const DEFAULT_TOOLBAR_OFFSET_HEIGHT = 40;
	const TOOLBAR_POSITION_OFFSET_TOP = 10;

	const options = [
		{
			value: CanvasFormatType.PARAGRAPH,
			label: 'Paragraph',
			text: 'paragraph',
			icon: <Icons.ParagraphIcon />
		},
		{ value: CanvasFormatType.HEADING_1, label: 'Big Heading', text: 'h1', icon: <Icons.H1Icon /> },
		{ value: CanvasFormatType.HEADING_2, label: 'Medium Heading', text: 'h2', icon: <Icons.H2Icon /> },
		{ value: CanvasFormatType.HEADING_3, label: 'Small Heading', text: 'h3', icon: <Icons.H3Icon /> },
		{ value: CanvasFormatType.CHECKED_LIST, label: 'Checked list', text: 'check', icon: <Icons.CheckListIcon /> },
		{ value: CanvasFormatType.ORDERED_LIST, label: 'Ordered list', text: 'ordered', icon: <Icons.OrderedListIcon /> },
		{ value: CanvasFormatType.BULLET_LIST, label: 'Bulleted list', text: 'bullet', icon: <Icons.BulletListIcon /> },
		{ value: CanvasFormatType.BLOCKQUOTE, label: 'Blockquote', text: 'blockquote', icon: <Icons.BlockquoteIcon /> }
	];

	const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		'code-block': false,
		link: '',
		h1: false,
		h2: false,
		h3: false,
		paragraph: true,
		check: false,
		ordered: false,
		bullet: false,
		blockquote: false,
		image: ''
	});

	useEffect(() => {
		if (content && quillRef.current && !hasSetInitialContent.current) {
			const selection = quillRef.current.getSelection();
			quillRef.current.setContents(safeJSONParse(content));
			if (selection) {
				quillRef.current.setSelection(selection.index, selection.length);
			}
			hasSetInitialContent.current = true;
		}
	}, [content]);

	useEffect(() => {
		quillRef.current = new Quill('#editor', {
			theme: 'snow',
			modules: {
				clipboard: {
					matchVisual: false
				}
			},
			placeholder: 'Type / to insert...'
		});
		setQuill(quillRef.current);

		quillRef.current.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
			delta.ops.forEach((op) => {
				if (op.attributes && op.attributes.background) {
					delete op.attributes.background;
				}
			});
			return delta;
		});

		if (content && quillRef.current) {
			quillRef.current.setContents(safeJSONParse(content));
		}

		if (!isEditAndDelCanvas) {
			quillRef.current.enable(false);
			quillRef.current.root.style.pointerEvents = 'auto';
			quillRef.current.root.style.userSelect = 'text';
		} else {
			quillRef.current.enable(true);
			quillRef.current.root.style.pointerEvents = 'auto';
			quillRef.current.root.style.userSelect = 'none';
		}

		quillRef.current.on('text-change', (delta, old, source) => {
			const data = JSON.stringify(quillRef.current?.getContents());
			handleContentChange(data, source, delta);
			const selection = quillRef.current?.getSelection();
			if (selection) {
				const formats = quillRef.current?.getFormat(selection.index, selection.length);
				setActiveFormats({
					bold: !!formats?.bold,
					italic: !!formats?.italic,
					underline: !!formats?.underline,
					strike: !!formats?.strike,
					'code-block': formats?.['code-block'] === QuillCodeBlockValue.PLAIN,
					link: (formats?.link as string) || '',
					h1: formats?.header === QuillHeaderValue.HEADER_1,
					h2: formats?.header === QuillHeaderValue.HEADER_2,
					h3: formats?.header === QuillHeaderValue.HEADER_3,
					paragraph: !(
						formats?.header === QuillHeaderValue.HEADER_1 ||
						formats?.header === QuillHeaderValue.HEADER_2 ||
						formats?.header === QuillHeaderValue.HEADER_3 ||
						formats?.list === QuillListValue.LIST_CHECKED ||
						formats?.list === QuillListValue.LIST_UNCHECKED ||
						formats?.list === QuillListValue.LIST_ORDERED ||
						formats?.list === QuillListValue.LIST_BULLET ||
						!!formats?.blockquote
					),
					check: formats?.list === QuillListValue.LIST_CHECKED || formats?.list === QuillListValue.LIST_UNCHECKED,
					ordered: formats?.list === QuillListValue.LIST_ORDERED,
					bullet: formats?.list === QuillListValue.LIST_BULLET,
					blockquote: !!formats?.blockquote,
					image: (formats?.image as string) || ''
				});
			}
		});

		const handleSelectionChange = (range: any) => {
			if (range && range.length > 0) {
				setToolbarVisible(true);
				requestAnimationFrame(() => {
					const bounds = quillRef.current?.getBounds(range.index, range.length);
					let newTop = 0;
					let newLeft = 0;

					if (bounds) {
						if (toolbarRef.current) {
							const toolbarHeight = toolbarRef.current.offsetHeight || DEFAULT_TOOLBAR_OFFSET_HEIGHT;
							newTop = bounds.top + window.scrollY - toolbarHeight - TOOLBAR_POSITION_OFFSET_TOP;
							newLeft = bounds.left + window.scrollX;
						}
					} else {
						const editorBounds = editorRef.current?.getBoundingClientRect();
						if (editorBounds) {
							const toolbarHeight = toolbarRef.current?.offsetHeight || DEFAULT_TOOLBAR_OFFSET_HEIGHT;
							newTop = editorBounds.top + window.scrollY - toolbarHeight - TOOLBAR_POSITION_OFFSET_TOP;
							newLeft = editorBounds.left + window.scrollX;
						}
					}

					setToolbarPosition((prevPosition) => {
						if (prevPosition.top !== newTop || prevPosition.left !== newLeft) {
							return { top: newTop, left: newLeft };
						}
						return prevPosition;
					});
				});
				const formats = quillRef.current?.getFormat(range) || {};
				let nextActiveOption = CanvasFormatType.PARAGRAPH; // Default to paragraph

				if (formats?.header === QuillHeaderValue.HEADER_1) {
					nextActiveOption = CanvasFormatType.HEADING_1;
				} else if (formats?.header === QuillHeaderValue.HEADER_2) {
					nextActiveOption = CanvasFormatType.HEADING_2;
				} else if (formats?.header === QuillHeaderValue.HEADER_3) {
					nextActiveOption = CanvasFormatType.HEADING_3;
				} else if (formats?.list === QuillListValue.LIST_CHECKED || formats?.list === QuillListValue.LIST_UNCHECKED) {
					nextActiveOption = CanvasFormatType.CHECKED_LIST;
				} else if (formats?.list === QuillListValue.LIST_ORDERED) {
					nextActiveOption = CanvasFormatType.ORDERED_LIST;
				} else if (formats?.list === QuillListValue.LIST_BULLET) {
					nextActiveOption = CanvasFormatType.BULLET_LIST;
				} else if (formats?.blockquote === true) {
					nextActiveOption = CanvasFormatType.BLOCKQUOTE;
				}

				setActiveOption(nextActiveOption);
				setActiveFormats({
					bold: !!formats.bold,
					italic: !!formats.italic,
					underline: !!formats.underline,
					strike: !!formats.strike,
					'code-block': formats?.['code-block'] === QuillCodeBlockValue.PLAIN,
					link: formats?.link as string,
					h1: formats?.header === QuillHeaderValue.HEADER_1,
					h2: formats?.header === QuillHeaderValue.HEADER_2,
					h3: formats?.header === QuillHeaderValue.HEADER_3,
					paragraph: !(
						formats?.header === QuillHeaderValue.HEADER_1 ||
						formats?.header === QuillHeaderValue.HEADER_2 ||
						formats?.header === QuillHeaderValue.HEADER_3 ||
						formats?.list === QuillListValue.LIST_CHECKED ||
						formats?.list === QuillListValue.LIST_UNCHECKED ||
						formats?.list === QuillListValue.LIST_ORDERED ||
						formats?.list === QuillListValue.LIST_BULLET ||
						!!formats?.blockquote
					),
					check: formats?.list === QuillListValue.LIST_CHECKED || formats?.list === QuillListValue.LIST_UNCHECKED,
					ordered: formats?.list === QuillListValue.LIST_ORDERED,
					bullet: formats?.list === QuillListValue.LIST_BULLET,
					blockquote: !!formats?.blockquote,
					image: (formats?.image as string) || ''
				});
			} else {
				setToolbarVisible(false);
				setActiveOption(CanvasFormatType.PARAGRAPH); // Reset to paragraph default
				setActiveFormats({
					bold: false,
					italic: false,
					underline: false,
					strike: false,
					'code-block': false,
					link: '',
					h1: false,
					h2: false,
					h3: false,
					paragraph: false,
					check: false,
					ordered: false,
					bullet: false,
					blockquote: false,
					image: ''
				});
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				setToolbarVisible(false);
			}
		};

		const handleClickOutside = (event: MouseEvent) => {
			if (
				editorRef.current &&
				!editorRef.current.contains(event.target as Node) &&
				toolbarRef.current &&
				!toolbarRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setToolbarVisible(false);
				setActiveFormats({
					bold: false,
					italic: false,
					underline: false,
					strike: false,
					'code-block': false,
					link: '',
					h1: false,
					h2: false,
					h3: false,
					paragraph: false,
					check: false,
					ordered: false,
					bullet: false,
					blockquote: false,
					image: ''
				});

				if (quillRef.current) {
					quillRef.current.setSelection(0, 0);
				}
			}
		};

		const handlePasteEvent = async (e: ClipboardEvent) => {
			await handlePaste({
				event: e,
				quillRef: quillRef.current,
				sessionRef,
				clientRef,
				currentClanId,
				currentChannelId
			});
		};

		const preventBase64ImagesHandler = (delta: Delta, oldDelta: Delta, source: string) => {
			preventBase64Images({ delta, oldDelta, source, quillRef: quillRef.current });
		};

		quillRef.current.on('text-change', preventBase64ImagesHandler);
		quillRef.current.on('selection-change', handleSelectionChange);
		quillRef.current.root.addEventListener('keydown', handleKeyDown);
		quillRef.current.root.addEventListener('paste', handlePasteEvent);
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			quillRef.current?.off('text-change', preventBase64ImagesHandler);
			quillRef.current?.off('selection-change', handleSelectionChange);
			quillRef.current?.root.removeEventListener('keydown', handleKeyDown);
			quillRef.current?.root.removeEventListener('paste', handlePasteEvent);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isEditAndDelCanvas]);

	const handleContentChange = (content: string, source: string, delta: any) => {
		dispatch(canvasActions.setContent(content));
		const hasContentChanges = delta?.ops?.some((op: any) => {
			if (op.retain && op.attributes) return true;
			return false;
		});

		if (hasContentChanges || source !== 'api') {
			onCanvasChange?.();
		}
	};

	const formatText = (format: keyof ActiveFormats) => {
		if (quillRef.current) {
			const currentSelection = quillRef?.current?.getSelection();
			const currentFormat = quillRef?.current?.getFormat(currentSelection?.index, currentSelection?.length);
			const isActive = !!currentFormat[format];
			if (isEditAndDelCanvas) {
				if (format === 'link') {
					quillRef.current.format(format, quillRef?.current.getText(currentSelection?.index, currentSelection?.length));
					setActiveFormats((prev: any) => ({
						...prev,
						[format]: quillRef?.current?.getText(currentSelection?.index, currentSelection?.length)
					}));
				} else {
					quillRef.current.format(format, !isActive);
					setActiveFormats((prev) => ({
						...prev,
						[format]: !isActive
					}));
				}
			}
		}
	};

	const handleSelectChange = (value: string) => {
		if (quill && isEditAndDelCanvas) {
			if (value === CanvasFormatType.HEADING_1) {
				quill.format('header', QuillHeaderValue.HEADER_1);
			} else if (value === CanvasFormatType.HEADING_2) {
				quill.format('header', QuillHeaderValue.HEADER_2);
			} else if (value === CanvasFormatType.HEADING_3) {
				quill.format('header', QuillHeaderValue.HEADER_3);
			} else if (value === CanvasFormatType.PARAGRAPH) {
				quill.format('header', false);
				quill.format('list', false);
				quill.format('blockquote', false);
			} else if (value === CanvasFormatType.CHECKED_LIST) {
				quill.format('list', QuillListValue.LIST_UNCHECKED);
			} else if (value === CanvasFormatType.ORDERED_LIST) {
				quill.format('list', QuillListValue.LIST_ORDERED);
			} else if (value === CanvasFormatType.BULLET_LIST) {
				quill.format('list', QuillListValue.LIST_BULLET);
			} else if (value === CanvasFormatType.BLOCKQUOTE) {
				quill.format('blockquote', true);
			}
			if (
				value === CanvasFormatType.HEADING_1 ||
				value === CanvasFormatType.HEADING_2 ||
				value === CanvasFormatType.HEADING_3 ||
				value === CanvasFormatType.PARAGRAPH
			) {
				setActiveFormats((prevFormats) => {
					const updatedFormats = {
						...prevFormats,
						header: value
					};
					return updatedFormats;
				});
			} else if (value === CanvasFormatType.CHECKED_LIST || value === CanvasFormatType.ORDERED_LIST || value === CanvasFormatType.BULLET_LIST) {
				setActiveFormats((prevFormats) => {
					const updatedFormats = {
						...prevFormats,
						list: value
					};
					return updatedFormats;
				});
			} else {
				setActiveFormats((prevFormats) => {
					const updatedFormats = {
						...prevFormats,
						[value]: value
					};
					return updatedFormats;
				});
			}
			setActiveOption(value as CanvasFormatType);
			setIsOpen(false);
		}
	};

	const getStyle = (type: 'button' | 'option', value: string | keyof ActiveFormats) => {
		const format = value as keyof ActiveFormats;
		if (type === 'button') {
			return {
				padding: '5px',
				fontWeight: format === 'bold' ? 600 : 'normal',
				fontStyle: format === 'italic' ? 'italic' : 'normal',
				textDecoration: format === 'underline' ? 'underline' : format === 'strike' ? 'line-through' : 'none',
				backgroundColor: activeFormats[format] ? 'var(--bg-item-hover)' : 'transparent',
				color: activeFormats[format] ? 'var(--text-secondary)' : 'var(--text-theme-primary)',
				border: 'none',
				cursor: 'pointer',
				borderRadius: '5px'
			};
		} else if (type === 'option') {
			const isActive = String(activeOption) === value || (value === CanvasFormatType.BLOCKQUOTE && activeFormats['blockquote']);
			return {
				color: isActive ? '#048dba !important' : 'var(--text-theme-primary)'
			};
		}
		return {};
	};

	useEffect(() => {
		const handleClickOutside = (event: { target: any }) => {
			if (selectRef.current && !selectRef?.current?.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className="note-canvas relative">
			{toolbarVisible && isEditAndDelCanvas && (
				<div
					ref={toolbarRef}
					id="toolbar"
					className="toolbar absolute flex items-center gap-2 bg-theme-contexify text-theme-primary rounded-[5px] z-[99] p-[5px]"
					style={{
						top: `${toolbarPosition.top}px`,
						left: `${toolbarPosition.left}px`,
						boxShadow: '0 0 0 1px #e8e8e840,0 1px 3px #00000014'
					}}
				>
					<div className="relative pl-[5px] cursor-pointer" ref={selectRef}>
						<div className="flex items-center" onClick={() => setIsOpen(!isOpen)}>
							{options.find((option) => option.value === String(activeOption))?.icon || <Icons.ParagraphIcon />}
							<Icons.ChevronDownIcon />
						</div>
						<div>
							{isOpen && (
								<ul className="absolute left-0 bg-theme-contexify pt-[12px] pr-[0] pb-[12px] pl-[0] rounded-[6px] min-w-[200px] max-w-[calc(100vh - 62px)] overflow-y-auto shadow-[0_0_0_1px_#e8e8e840,0_1px_3px_#00000014]">
									{options.map((option) => (
										<React.Fragment key={option.value}>
											<li
												key={option.value}
												onClick={() => handleSelectChange(option.value)}
												style={getStyle('option', option.value)}
												value={option.value}
												className={`min-h-[28px] cursor-pointer pt-[0] pr-[24px] pb-[0] pl-[10px] flex items-center ${
													String(activeOption) === option.value ||
													(option.value === CanvasFormatType.BLOCKQUOTE && activeFormats['blockquote'])
														? 'text-[#048dba]'
														: ''
												}`}
											>
												{String(activeOption) === option.value ||
												(option.value === CanvasFormatType.BLOCKQUOTE && activeFormats['blockquote']) ? (
													<span className="mr-[5px] w-[10px]">
														<Icons.CheckedIcon color="#048dba" />
													</span>
												) : (
													<span className="mr-[5px] w-[10px]"></span>
												)}
												{option.icon && (
													<span className="mr-[20px]">
														{React.cloneElement(option.icon, {
															color:
																String(activeOption) === option.value ||
																(option.value === CanvasFormatType.BLOCKQUOTE && activeFormats['blockquote'])
																	? '#048dba'
																	: 'currentColor'
														})}
													</span>
												)}
												{option.label}
											</li>
											{option.value === CanvasFormatType.HEADING_3 && <hr className="border-gray-400 my-2" />}
										</React.Fragment>
									))}
								</ul>
							)}
						</div>
					</div>
					<span className={`separator h-5 w-px mx-1 ${isLightMode ? 'bg-white' : 'bg-[#8080808f]'}`}></span>

					<button
						className={`disabled:opacity-50 disabled:cursor-auto  ${activeFormats['bold'] ? 'bg-theme-contexify' : ''}`}
						type="button"
						onClick={() => formatText('bold')}
						style={getStyle('button', 'bold')}
						title="Bold"
						disabled={activeFormats['code-block']}
					>
						<svg data-5iu="true" data-qa="bold" aria-hidden="true" viewBox="0 0 20 20" className="w-[1em] h-[1em]">
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M4 2.75A.75.75 0 0 1 4.75 2h6.343a3.91 3.91 0 0 1 3.88 3.449A2 2 0 0 1 15 5.84l.001.067a3.9 3.9 0 0 1-1.551 3.118A4.627 4.627 0 0 1 11.875 18H4.75a.75.75 0 0 1-.75-.75V9.5a.8.8 0 0 1 .032-.218A.8.8 0 0 1 4 9.065zm2.5 5.565h3.593a2.157 2.157 0 1 0 0-4.315H6.5zm4.25 1.935H6.5v5.5h4.25a2.75 2.75 0 1 0 0-5.5"
								clipRule="evenodd"
							></path>
						</svg>
					</button>

					<button
						className="disabled:opacity-50 disabled:cursor-auto"
						type="button"
						onClick={() => formatText('italic')}
						style={getStyle('button', 'italic')}
						title="Italic"
						disabled={activeFormats['code-block']}
					>
						<svg data-5iu="true" data-qa="italic" aria-hidden="true" viewBox="0 0 20 20" className="w-[1em] h-[1em]">
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M7 2.75A.75.75 0 0 1 7.75 2h7.5a.75.75 0 0 1 0 1.5H12.3l-2.6 13h2.55a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5H7.7l2.6-13H7.75A.75.75 0 0 1 7 2.75"
								clipRule="evenodd"
							></path>
						</svg>
					</button>

					<button
						className="disabled:opacity-50 disabled:cursor-auto"
						type="button"
						onClick={() => formatText('strike')}
						style={getStyle('button', 'strike')}
						title="Strikethrough"
						disabled={activeFormats['code-block']}
					>
						<svg data-5iu="true" data-qa="strikethrough" aria-hidden="true" viewBox="0 0 20 20" className="w-[1em] h-[1em]">
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M11.721 3.84c-.91-.334-2.028-.36-3.035-.114-1.51.407-2.379 1.861-2.164 3.15C6.718 8.051 7.939 9.5 11.5 9.5l.027.001h5.723a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5h3.66c-.76-.649-1.216-1.468-1.368-2.377-.347-2.084 1.033-4.253 3.265-4.848l.007-.002.007-.002c1.252-.307 2.68-.292 3.915.16 1.252.457 2.337 1.381 2.738 2.874a.75.75 0 0 1-1.448.39c-.25-.925-.91-1.528-1.805-1.856m2.968 9.114a.75.75 0 1 0-1.378.59c.273.64.186 1.205-.13 1.674-.333.492-.958.925-1.82 1.137-.989.243-1.991.165-3.029-.124-.93-.26-1.613-.935-1.858-1.845a.75.75 0 0 0-1.448.39c.388 1.441 1.483 2.503 2.903 2.9 1.213.338 2.486.456 3.79.135 1.14-.28 2.12-.889 2.704-1.753.6-.888.743-1.992.266-3.104"
								clipRule="evenodd"
							></path>
						</svg>
					</button>

					<span className={`separator h-5 w-px mx-1 ${isLightMode ? 'bg-white' : 'bg-[#8080808f]'}`}></span>

					<button type="button" onClick={() => formatText('code-block')} style={getStyle('button', 'code-block')} title="Code Block">
						<svg data-5iu="true" data-qa="code" aria-hidden="true" viewBox="0 0 20 20" className="w-[1em] h-[1em]">
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M12.058 3.212c.396.12.62.54.5.936L8.87 16.29a.75.75 0 1 1-1.435-.436l3.686-12.143a.75.75 0 0 1 .936-.5M5.472 6.24a.75.75 0 0 1 .005 1.06l-2.67 2.693 2.67 2.691a.75.75 0 1 1-1.065 1.057l-3.194-3.22a.75.75 0 0 1 0-1.056l3.194-3.22a.75.75 0 0 1 1.06-.005m9.044 1.06a.75.75 0 1 1 1.065-1.056l3.194 3.221a.75.75 0 0 1 0 1.057l-3.194 3.219a.75.75 0 0 1-1.065-1.057l2.67-2.69z"
								clipRule="evenodd"
							></path>
						</svg>
					</button>
					<span className={`separator h-5 w-px mx-1 ${isLightMode ? 'bg-white' : 'bg-[#8080808f]'}`}></span>
					<button
						className="ql-link disabled:opacity-50 disabled:cursor-auto"
						type="button"
						onClick={() => formatText('link')}
						style={getStyle('button', 'link')}
						title="Link"
						disabled={activeFormats['code-block']}
					>
						<svg data-5iu="true" data-qa="link" aria-hidden="true" viewBox="0 0 20 20" className="w-[1em] h-[1em]">
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M12.306 3.756a2.75 2.75 0 0 1 3.889 0l.05.05a2.75 2.75 0 0 1 0 3.889l-3.18 3.18a2.75 2.75 0 0 1-3.98-.095l-.03-.034a.75.75 0 0 0-1.11 1.009l.03.034a4.25 4.25 0 0 0 6.15.146l3.18-3.18a4.25 4.25 0 0 0 0-6.01l-.05-.05a4.25 4.25 0 0 0-6.01 0L9.47 4.47a.75.75 0 1 0 1.06 1.06zm-4.611 12.49a2.75 2.75 0 0 1-3.89 0l-.05-.051a2.75 2.75 0 0 1 0-3.89l3.18-3.179a2.75 2.75 0 0 1 3.98.095l.03.034a.75.75 0 1 0 1.11-1.01l-.03-.033a4.25 4.25 0 0 0-6.15-.146l-3.18 3.18a4.25 4.25 0 0 0 0 6.01l.05.05a4.25 4.25 0 0 0 6.01 0l1.775-1.775a.75.75 0 0 0-1.06-1.06z"
								clipRule="evenodd"
							></path>
						</svg>
					</button>
				</div>
			)}
			<div id="editor" ref={editorRef} className="h-auto w-full text-[15px] text-theme-primary !border-none" />
			<style>
				{`
				#editor .ql-editor.ql-blank::before {
					color: ${placeholderColor};
					opacity: 1;
				}

				#editor .ql-snow .ql-editor code {
					color: var(--text-theme-primary), !important;
				}

				#editor span, #editor strong {
					color: ${placeholderColor} !important;
				}

				.note-canvas .ql-toolbar {
					display: none;
				}

				.note-canvas .ql-tooltip {
					left: 0 !important;
				}
				.note-canvas .ql-editor .ql-code-block-container {
					background-color: var(--theme-setting-primary);
					color: var(--text-theme-primary);
				}
      `}
			</style>
		</div>
	);
}

export default CanvasContent;
