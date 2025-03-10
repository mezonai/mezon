import { canvasActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { safeJSONParse } from 'mezon-js';
import Quill from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

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
};

function CanvasContent({ isLightMode, content, idCanvas, isEditAndDelCanvas }: CanvasContentProps) {
	const [toolbarVisible, setToolbarVisible] = useState(false);
	const quillRef = useRef<Quill | null>(null);
	const editorRef = useRef<HTMLDivElement | null>(null);
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const dispatch = useDispatch();
	const [quill, setQuill] = useState<Quill | null>(null);
	const placeholderColor = isLightMode ? 'rgba(0,0,0,0.6)' : '#ffffff';
	const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

	const [activeOption, setActiveOption] = useState('paragraph');

	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);
	const DEFAULT_TOOLBAR_OFFSET_HEIGHT = 40;
	const TOOLBAR_POSITION_OFFSET_TOP = 10;

	const options = [
		{
			value: 'paragraph',
			label: 'Paragraph',
			text: 'paragraph',
			icon: <Icons.ParagraphIcon />
		},
		{ value: '1', label: 'Big Heading', text: 'h1', icon: <Icons.H1Icon /> },
		{ value: '2', label: 'Medium Heading', text: 'h2', icon: <Icons.H2Icon /> },
		{ value: '3', label: 'Small Heading', text: 'h3', icon: <Icons.H3Icon /> },
		{ value: 'check', label: 'Checked list', text: 'check', icon: <Icons.CheckListIcon /> },
		{ value: 'ordered', label: 'Ordered list', text: 'ordered', icon: <Icons.OrderedListIcon /> },
		{ value: 'bullet', label: 'Bulleted list', text: 'bullet', icon: <Icons.BulletListIcon /> },
		{ value: 'blockquote', label: 'Blockquote', text: 'blockquote', icon: <Icons.BlockquoteIcon /> }
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
		if (content && quillRef.current) {
			const selection = quillRef.current.getSelection();
			quillRef.current.setContents(safeJSONParse(content));
			if (selection) {
				quillRef.current.setSelection(selection.index, selection.length);
			}
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
				// if (op.attributes && op.attributes.color) {
				// 	op.attributes.color = isLightMode ? 'black' : 'white';
				// }
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

		quillRef.current.on('text-change', () => {
			const data = JSON.stringify(quillRef.current?.getContents());
			handleContentChange(data);
			const selection = quillRef.current?.getSelection();
			if (selection) {
				const formats = quillRef.current?.getFormat(selection.index, selection.length);
				setActiveFormats({
					bold: !!formats?.bold,
					italic: !!formats?.italic,
					underline: !!formats?.underline,
					strike: !!formats?.strike,
					'code-block': formats?.['code-block'] === 'plain',
					link: (formats?.link as string) || '',
					h1: formats?.header === 1,
					h2: formats?.header === 2,
					h3: formats?.header === 3,
					paragraph: !(
						formats?.header === 1 ||
						formats?.header === 2 ||
						formats?.header === 3 ||
						formats?.list === 'check' ||
						formats?.list === 'ordered' ||
						formats?.list === 'ordered' ||
						!!formats?.blockquote
					),
					check: formats?.list === 'check',
					ordered: formats?.list === 'ordered',
					bullet: formats?.list === 'bullet',
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
				setActiveOption(
					(formats?.header as string) || (formats?.list as string) || (formats?.blockquote === true ? 'blockquote' : 'paragraph')
				);
				setActiveFormats({
					bold: !!formats.bold,
					italic: !!formats.italic,
					underline: !!formats.underline,
					strike: !!formats.strike,
					'code-block': formats?.['code-block'] === 'plain',
					link: formats?.link as string,
					h1: formats?.header === 1,
					h2: formats?.header === 2,
					h3: formats?.header === 3,
					paragraph: !(
						formats?.header === 1 ||
						formats?.header === 2 ||
						formats?.header === 3 ||
						formats?.list === 'check' ||
						formats?.list === 'ordered' ||
						formats?.list === 'bullet' ||
						!!formats?.blockquote
					),
					check: formats?.list === 'check',
					ordered: formats?.list === 'ordered',
					bullet: formats?.list === 'bullet',
					blockquote: !!formats?.blockquote,
					image: (formats?.image as string) || ''
				});
			} else {
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

		quillRef.current.on('selection-change', handleSelectionChange);
		quillRef.current.root.addEventListener('keydown', handleKeyDown);
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			quillRef.current?.off('selection-change', handleSelectionChange);
			quillRef.current?.root.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isEditAndDelCanvas]);

	const handleContentChange = (content: string) => {
		dispatch(canvasActions.setContent(content));
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
			if (value === '1') {
				quill.format('header', 1);
			} else if (value === '2') {
				quill.format('header', 2);
			} else if (value === '3') {
				quill.format('header', 3);
			} else if (value === 'paragraph') {
				quill.format('header', true);
			} else if (value === 'check') {
				quill.format('list', 'check');
			} else if (value === 'ordered') {
				quill.format('list', 'ordered');
			} else if (value === 'bullet') {
				quill.format('list', 'bullet');
			} else if (value === 'blockquote') {
				quill.format('blockquote', true);
			}
			if (value === '1' || value === '2' || value === '3' || value === 'paragraph') {
				setActiveFormats((prevFormats) => {
					const updatedFormats = {
						...prevFormats,
						header: value
					};
					return updatedFormats;
				});
			} else if (value === 'check' || value === 'ordered' || value === 'bullet') {
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
				backgroundColor: activeFormats[format] ? (isLightMode ? '#d3d3d3' : '#555') : 'transparent',
				color: 'white',
				border: 'none',
				cursor: 'pointer',
				borderRadius: '5px'
			};
		} else if (type === 'option') {
			return {
				color: activeFormats[format] ? '#048dba' : 'white'
			};
		}
		return {};
	};

	useEffect(() => {
		quillRef?.current?.setContents(quillRef.current.getContents());
		quillRef?.current?.formatText(0, quillRef.current.getLength(), { color: isLightMode ? 'rgb(51, 51, 51)' : 'white' });
	}, [isLightMode, idCanvas]);

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
		<div className="note-canvas" style={{ position: 'relative' }}>
			{toolbarVisible && isEditAndDelCanvas && (
				<div
					ref={toolbarRef}
					id="toolbar"
					className="toolbar"
					style={{
						position: 'absolute',
						top: `${toolbarPosition.top}px`,
						left: `${toolbarPosition.left}px`,
						padding: '5px',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						background: '#333',
						color: 'white',
						borderRadius: '5px',
						zIndex: 99,
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
								<ul
									style={{ boxShadow: '0 0 0 1px #e8e8e840,0 1px 3px #00000014' }}
									className="absolute left-0 bg-[#313338] pt-[12px] pr-[0] pb-[12px] pl-[0] rounded-[6px] min-w-[200px] max-w-[calc(100vh - 62px)] overflow-y-auto"
								>
									{options.map((option) => (
										<React.Fragment key={option.value}>
											<li
												key={option.value}
												onClick={() => handleSelectChange(option.value)}
												style={getStyle('option', `${option.text}`)}
												value={option.value}
												className="min-h-[28px] cursor-pointer pt-[0] pr-[24px] pb-[0] pl-[10px] flex items-center"
											>
												{String(activeOption) === option.value ||
												(option.value === 'blockquote' && activeFormats['blockquote']) ? (
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
																(String(activeOption) === option.value ||
																	(option.value === 'blockquote' && activeFormats['blockquote'])) &&
																'#048dba'
														})}
													</span>
												)}
												{option.label}
											</li>
											{option.value === '3' && <hr className="border-gray-400 my-2" />}
										</React.Fragment>
									))}
								</ul>
							)}
						</div>
					</div>
					<span
						className={`separator ${isLightMode ? 'bg-white' : 'bg-[#8080808f]'}`}
						style={{ height: '20px', width: '1px', margin: '0 4px' }}
					></span>

					<button
						className="disabled:opacity-50 disabled:cursor-auto"
						type="button"
						onClick={() => formatText('bold')}
						style={getStyle('button', 'bold')}
						title="Bold"
						disabled={activeFormats['code-block']}
					>
						<svg data-5iu="true" data-qa="bold" aria-hidden="true" viewBox="0 0 20 20" style={{ width: '1em', height: '1em' }}>
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
						<svg data-5iu="true" data-qa="italic" aria-hidden="true" viewBox="0 0 20 20" style={{ width: '1em', height: '1em' }}>
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
						<svg data-5iu="true" data-qa="strikethrough" aria-hidden="true" viewBox="0 0 20 20" style={{ width: '1em', height: '1em' }}>
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M11.721 3.84c-.91-.334-2.028-.36-3.035-.114-1.51.407-2.379 1.861-2.164 3.15C6.718 8.051 7.939 9.5 11.5 9.5l.027.001h5.723a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5h3.66c-.76-.649-1.216-1.468-1.368-2.377-.347-2.084 1.033-4.253 3.265-4.848l.007-.002.007-.002c1.252-.307 2.68-.292 3.915.16 1.252.457 2.337 1.381 2.738 2.874a.75.75 0 0 1-1.448.39c-.25-.925-.91-1.528-1.805-1.856m2.968 9.114a.75.75 0 1 0-1.378.59c.273.64.186 1.205-.13 1.674-.333.492-.958.925-1.82 1.137-.989.243-1.991.165-3.029-.124-.93-.26-1.613-.935-1.858-1.845a.75.75 0 0 0-1.448.39c.388 1.441 1.483 2.503 2.903 2.9 1.213.338 2.486.456 3.79.135 1.14-.28 2.12-.889 2.704-1.753.6-.888.743-1.992.266-3.104"
								clipRule="evenodd"
							></path>
						</svg>
					</button>

					<span
						className={`separator ${isLightMode ? 'bg-white' : 'bg-[#8080808f]'}`}
						style={{ height: '20px', width: '1px', margin: '0 4px' }}
					></span>

					<button type="button" onClick={() => formatText('code-block')} style={getStyle('button', 'code-block')} title="Code Block">
						<svg data-5iu="true" data-qa="code" aria-hidden="true" viewBox="0 0 20 20" style={{ width: '1em', height: '1em' }}>
							<path
								fill="currentColor"
								fillRule="evenodd"
								d="M12.058 3.212c.396.12.62.54.5.936L8.87 16.29a.75.75 0 1 1-1.435-.436l3.686-12.143a.75.75 0 0 1 .936-.5M5.472 6.24a.75.75 0 0 1 .005 1.06l-2.67 2.693 2.67 2.691a.75.75 0 1 1-1.065 1.057l-3.194-3.22a.75.75 0 0 1 0-1.056l3.194-3.22a.75.75 0 0 1 1.06-.005m9.044 1.06a.75.75 0 1 1 1.065-1.056l3.194 3.221a.75.75 0 0 1 0 1.057l-3.194 3.219a.75.75 0 0 1-1.065-1.057l2.67-2.69z"
								clipRule="evenodd"
							></path>
						</svg>
					</button>
					<span
						className={`separator ${isLightMode ? 'bg-white' : 'bg-[#8080808f]'}`}
						style={{ height: '20px', width: '1px', margin: '0 4px' }}
					></span>
					<button
						className="ql-link disabled:opacity-50 disabled:cursor-auto"
						type="button"
						onClick={() => formatText('link')}
						style={getStyle('button', 'link')}
						title="Link"
						disabled={activeFormats['code-block']}
					>
						<svg data-5iu="true" data-qa="link" aria-hidden="true" viewBox="0 0 20 20" style={{ width: '1em', height: '1em' }}>
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
			<div
				id="editor"
				ref={editorRef}
				style={{
					height: 'auto',
					width: '100%',
					fontSize: '15px',
					color: isLightMode ? 'black' : 'white',
					border: 'none'
				}}
			/>
			<style>
				{`
				#editor .ql-editor.ql-blank::before {
					color: ${placeholderColor};
					opacity: 1;
				}

				#editor .ql-snow .ql-editor code {
					background-color: #23241f;
					color: #f0f0f0 !important;
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
      `}
			</style>
		</div>
	);
}

export default CanvasContent;
