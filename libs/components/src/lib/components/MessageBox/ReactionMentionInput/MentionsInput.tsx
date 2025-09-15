import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import { ID_MENTION_HERE, generateE2eId } from '@mezon/utils';
import React, {
	Children,
	cloneElement,
	forwardRef,
	isValidElement,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState
} from 'react';
import { createPortal } from 'react-dom';
import type { MentionData, MentionProps, MentionState } from './Mention';
import parseHtmlAsFormattedText from './parseHtmlAsFormattedText';
import { preparePastedHtml } from './utils/cleanHtml';
import renderText from './utils/renderText';

export interface User {
	id: string;
	username?: string;
	displayName: string;
	avatar?: string;
}

export interface MentionItem {
	display: string;
	id: string;
	childIndex: number;
	index: number;
	plainTextIndex: number;
}

export interface MessageEntity {
	type:
		| 'MessageEntityBold'
		| 'MessageEntityItalic'
		| 'MessageEntityUnderline'
		| 'MessageEntityStrike'
		| 'MessageEntityCode'
		| 'MessageEntityPre'
		| 'MessageEntitySpoiler'
		| 'MessageEntityBlockquote'
		| 'MessageEntityMentionName'
		| 'MessageEntityTextUrl';
	offset: number;
	length: number;
	userId?: string;
	url?: string;
	language?: string;
}

export interface FormattedText {
	text: string;
	entities?: MessageEntity[];
}

interface IOrganizedEntity {
	entity: any;
	organizedIndexes: Set<number>;
	nestedEntities: IOrganizedEntity[];
}

export interface MentionsInputProps {
	value?: string;
	placeholder?: string;
	onSend?: (data: FormattedText) => void;
	onChange?: (html: string) => void;
	onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement | HTMLInputElement>) => void;
	className?: string;
	style?: React.CSSProperties;
	messageSendKeyCombo?: 'enter' | 'ctrl-enter';
	isMobile?: boolean;
	disabled?: boolean;
	children?: React.ReactNode;
	id?: string;
	suggestionsPortalHost?: Element;
	suggestionStyle?: React.CSSProperties;
	suggestionsClassName?: string;
	onHandlePaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
	enableUndoRedo?: boolean;
	maxHistorySize?: number;
	hasFilesToSend?: boolean;
	setCaretToEnd?: boolean;
	currentChannelId?: string;
}

export interface MentionsInputHandle {
	insertEmoji: (emojiId: string, emojiDisplay: string) => void;
	insertMentionCommand: (content: string, clearOldValue?: boolean) => void;
	focus: () => void;
	blur: () => void;
	getElement: () => HTMLDivElement | null;
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
}

interface ActiveMentionContext {
	trigger: string;
	config: MentionProps;
	mentionState: MentionState;
}

const prepareForRegExp = (html: string): string => {
	return html
		.replace(/(<br>|<br\s?\/>)/g, '\n')
		.replace(/(&nbsp;|\u00A0)/g, ' ')
		.replace(/(<div>|<\/div>)/gi, '')
		.replace(/\n$/i, '');
};

const cleanWebkitNewLines = (html: string): string => {
	return html.replace(/<div>(<br>|<br\s?\/>)?<\/div>/gi, '<br>');
};

const requestNextMutation = (callback: () => void): void => {
	Promise.resolve().then(callback);
};

const getHtmlBeforeSelection = (container: HTMLElement): string => {
	if (!container) {
		return '';
	}

	const sel = window.getSelection();
	if (!sel?.rangeCount) {
		return container.innerHTML;
	}

	const range = sel.getRangeAt(0).cloneRange();
	if (!range.intersectsNode(container)) {
		return container.innerHTML;
	}
	if (!container.contains(range.commonAncestorContainer)) {
		return '';
	}

	range.collapse(true);
	range.setStart(container, 0);

	const extractorEl = document.createElement('div');
	extractorEl.innerHTML = '';
	extractorEl.appendChild(range.cloneContents());

	return extractorEl.innerHTML;
};

const getCaretPosition = (element: HTMLElement): number => {
	let caretPosition = 0;
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) {
		return caretPosition;
	}

	const range = selection.getRangeAt(0);
	const caretRange = range.cloneRange();
	caretRange.selectNodeContents(element);
	caretRange.setEnd(range.endContainer, range.endOffset);
	caretPosition = caretRange.toString().length;

	return caretPosition;
};

const setCaretPosition = (element: Node, position: number): void => {
	const setPosition = (node: Node, pos: number): number => {
		for (const child of Array.from(node.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE) {
				if ((child as Text).length >= pos) {
					const range = document.createRange();
					const selection = window.getSelection()!;
					range.setStart(child, pos);
					range.collapse(true);
					selection.removeAllRanges();
					selection.addRange(range);
					return -1;
				}
				pos -= (child as Text).length;
			} else {
				pos = setPosition(child, pos);
				if (pos === -1) {
					return -1;
				}
			}
		}
		return pos;
	};

	setPosition(element, position);
};

const insertHtmlInSelection = (html: string): void => {
	const selection = window.getSelection();

	if (selection?.getRangeAt && selection.rangeCount) {
		const range = selection.getRangeAt(0);
		range.deleteContents();

		const fragment = range.createContextualFragment(html);
		const lastInsertedNode = fragment.lastChild;
		range.insertNode(fragment);
		if (lastInsertedNode) {
			range.setStartAfter(lastInsertedNode);
			range.setEndAfter(lastInsertedNode);
		} else {
			range.collapse(false);
		}
		selection.removeAllRanges();
		selection.addRange(range);
	}
};

const positionCaretAfterEmoji = (inputEl: HTMLElement, config: any, markup: string) => {
	if (config.trigger === ':' && markup === '::[__display__](__id__)') {
		const emojiSpans = inputEl.querySelectorAll('[data-entity-type="MessageEntityCustomEmoji"]');
		const lastEmojiSpan = emojiSpans[emojiSpans.length - 1] as HTMLElement;

		if (lastEmojiSpan) {
			const selection = window.getSelection();
			if (selection) {
				const range = document.createRange();
				range.setStartAfter(lastEmojiSpan);
				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
				return true;
			}
		}
	}
	return false;
};

const MentionsInput = forwardRef<MentionsInputHandle, MentionsInputProps>(
	(
		{
			value = '',
			placeholder = 'Type a message...',
			onSend,
			onChange,
			onKeyDown,
			className = '',
			style,
			messageSendKeyCombo = 'enter',
			isMobile = false,
			disabled = false,
			children,
			id,
			suggestionsClassName = '',
			suggestionStyle,
			onHandlePaste,
			enableUndoRedo = false,
			maxHistorySize = 50,
			hasFilesToSend = false,
			setCaretToEnd = false,
			currentChannelId
		},
		ref
	) => {
		const inputRef = useRef<HTMLDivElement>(null);
		const popoverRef = useRef<HTMLDivElement>(null);

		const [html, setHtml] = useState(value);
		const [activeMentionContext, setActiveMentionContext] = useState<ActiveMentionContext | null>(null);
		const [triggerSelection, setTriggerSelection] = useState<boolean>(false);
		const savedCaretPositionRef = useRef<{ range: Range; inputHtml: string } | null>(null);
		const [suggestionsCount, setSuggestionsCount] = useState(0);

		const [undoHistory, setUndoHistory] = useState<string[]>([]);
		const [redoHistory, setRedoHistory] = useState<string[]>([]);
		const isUndoRedoAction = useRef<boolean>(false);
		const [inputWidth, setInputWidth] = useState(800);
		const detectMentionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

		const mentionConfigs = Children.toArray(children)
			.filter((child): child is React.ReactElement<MentionProps> => isValidElement(child) && typeof child.type === 'function')
			.map((child) => child.props);

		useEffect(() => {
			if (inputRef.current) {
				inputRef.current.innerHTML = value;
				if (setCaretToEnd && value) {
					requestNextMutation(() => {
						if (inputRef.current) {
							inputRef.current.focus();
							const textContent = inputRef.current.textContent || '';
							setCaretPosition(inputRef.current, textContent.length);
						}
					});
				}
			}
		}, []);

		useEffect(() => {
			if (value !== html) {
				setHtml(value);
				if (inputRef.current) {
					inputRef.current.innerHTML = value;
				}
			}
		}, [value]);

		useEffect(() => {
			setActiveMentionContext(null);
			setSuggestionsCount(0);
		}, [currentChannelId]);

		useEffect(() => {
			const handleGlobalKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Escape' && activeMentionContext) {
					e.preventDefault();
					setActiveMentionContext(null);
				}
			};

			const handleClickOutside = (e: MouseEvent) => {
				if (activeMentionContext && popoverRef.current && inputRef.current) {
					const target = e.target as Node;
					if (!popoverRef.current.contains(target) && !inputRef.current.contains(target)) {
						setActiveMentionContext(null);
					}
				}
			};

			document.addEventListener('keydown', handleGlobalKeyDown);
			document.addEventListener('mousedown', handleClickOutside);

			return () => {
				if (detectMentionTimeoutRef.current) {
					clearTimeout(detectMentionTimeoutRef.current);
				}
				document.removeEventListener('keydown', handleGlobalKeyDown);
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [activeMentionContext]);

		const triggerRegex = useMemo(() => {
			if (mentionConfigs.length === 0) return null;

			const triggerGroups = new Map<string, string[]>();

			mentionConfigs.forEach((config) => {
				const escapedTrigger = config.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				let charClass = '\\w\\u00C0-\\u024F\\u1E00-\\u1EFF.-'; // Base characters
				if (config.allowedCharacters) {
					const escapedChars = config.allowedCharacters.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					charClass += escapedChars;
				}
				let pattern;
				if (config.allowSpaceInQuery) {
					pattern = `(${escapedTrigger})(?:[${charClass}][${charClass}\\s]*)?`;
				} else {
					pattern = `(${escapedTrigger})(?:[${charClass}]+)?`;
				}

				if (!triggerGroups.has(pattern)) {
					triggerGroups.set(pattern, []);
				}
				triggerGroups.get(pattern)!.push(pattern);
			});

			const regexParts: string[] = [];

			triggerGroups.forEach((patterns, _key) => {
				if (patterns.length > 0) {
					regexParts.push(...patterns);
				}
			});

			if (regexParts.length === 0) return null;

			const combinedPattern = `(^|\\s)(${regexParts.join('|')})$`;
			return new RegExp(combinedPattern, 'gi');
		}, [mentionConfigs]);

		const addToHistory = useCallback(
			(htmlValue: string) => {
				if (!enableUndoRedo || isUndoRedoAction.current) return;

				setUndoHistory((prev) => {
					const newHistory = [...prev, htmlValue];
					if (newHistory.length > maxHistorySize) {
						return newHistory.slice(-maxHistorySize);
					}
					return newHistory;
				});
				setRedoHistory([]);
			},
			[enableUndoRedo, maxHistorySize]
		);

		const undo = useCallback(() => {
			if (!enableUndoRedo || undoHistory.length === 0) return;

			const currentHtml = html;
			const previousHtml = undoHistory[undoHistory.length - 1];

			setRedoHistory((prev) => [currentHtml, ...prev]);

			setUndoHistory((prev) => prev.slice(0, -1));

			isUndoRedoAction.current = true;
			setHtml(previousHtml);
			if (inputRef.current) {
				inputRef.current.innerHTML = previousHtml;
			}
			onChange?.(previousHtml);

			requestNextMutation(() => {
				if (inputRef.current) {
					inputRef.current.focus();
					const textContent = inputRef.current.textContent || '';
					setCaretPosition(inputRef.current, textContent.length);
				}
				isUndoRedoAction.current = false;
			});
		}, [enableUndoRedo, undoHistory, html, onChange]);

		const redo = useCallback(() => {
			if (!enableUndoRedo || redoHistory.length === 0) return;

			const currentHtml = html;
			const nextHtml = redoHistory[0];

			setUndoHistory((prev) => [...prev, currentHtml]);
			setRedoHistory((prev) => prev.slice(1));

			isUndoRedoAction.current = true;
			setHtml(nextHtml);
			if (inputRef.current) {
				inputRef.current.innerHTML = nextHtml;
			}
			onChange?.(nextHtml);

			requestNextMutation(() => {
				if (inputRef.current) {
					inputRef.current.focus();
					const textContent = inputRef.current.textContent || '';
					setCaretPosition(inputRef.current, textContent.length);
				}
				isUndoRedoAction.current = false;
			});
		}, [enableUndoRedo, redoHistory, html, onChange]);

		const canUndo = useCallback(() => {
			return enableUndoRedo && undoHistory.length > 0;
		}, [enableUndoRedo, undoHistory.length]);

		const canRedo = useCallback(() => {
			return enableUndoRedo && redoHistory.length > 0;
		}, [enableUndoRedo, redoHistory.length]);

		const detectMention = useCallback(async () => {
			if (!inputRef.current || mentionConfigs.length === 0 || !triggerRegex) {
				setActiveMentionContext(null);
				return;
			}

			const htmlBeforeSelection = getHtmlBeforeSelection(inputRef.current);
			const prepared = prepareForRegExp(htmlBeforeSelection);
			const match = prepared.match(triggerRegex);

			if (match) {
				const fullMatch = match[0];
				const trigger = fullMatch.trim().charAt(0);
				const query = fullMatch.trim().substring(1);
				const startPos = prepared.lastIndexOf(fullMatch);
				const endPos = startPos + fullMatch.length;

				const config = mentionConfigs.find((c) => c.trigger === trigger);
				if (!config) {
					setActiveMentionContext(null);
					return;
				}

				const mentionState: MentionState = {
					isActive: false,
					query,
					startPos,
					endPos,
					suggestions: [],
					isLoading: false,
					selectedIndex: 0
				};

				setActiveMentionContext({
					trigger,
					config,
					mentionState
				});
				return;
			}

			setActiveMentionContext(null);
		}, [mentionConfigs, triggerRegex]);

		const debouncedDetectMention = useCallback(() => {
			if (detectMentionTimeoutRef.current) {
				clearTimeout(detectMentionTimeoutRef.current);
			}
			detectMentionTimeoutRef.current = setTimeout(() => {
				detectMention();
			}, 30);
		}, [detectMention]);

		const insertMentionDirectly = useCallback(
			(suggestion: MentionData, config: any, skipFocus = false) => {
				if (!inputRef.current) {
					return;
				}

				const { displayTransform, markup = `${config.trigger}[__display__](__id__)`, displayPrefix = config.trigger } = config;

				const display = displayTransform ? displayTransform(suggestion.id, suggestion.display) : suggestion.display;

				let htmlToInsert: string;
				if (markup !== `${config.trigger}[__display__](__id__)`) {
					if (config.trigger === ':' && markup === '::[__display__](__id__)') {
						htmlToInsert = `<span
					data-entity-type="MessageEntityCustomEmoji"
					data-document-id="${suggestion.id}"
					contenteditable="false"
					class="text-entity-emoji"
					dir="auto"
				>${display}</span>`;
					} else if (config.trigger === '#' && markup === '#[__display__](__id__)') {
						htmlToInsert = `<a
					class="text-entity-link hashtag"
					data-entity-type="MessageEntityHashtag"
					data-user-id="${suggestion.id}"
					contenteditable="false"
					dir="auto"
				>#${display}</a>`;
					} else {
						htmlToInsert = markup.replace(/__id__/g, suggestion.id).replace(/__display__/g, display);
					}
				} else {
					if (config.trigger === '#') {
						htmlToInsert = `<a
					class="text-entity-link hashtag"
					data-entity-type="MessageEntityHashtag"
					data-id="${suggestion.id}"
					contenteditable="false"
					dir="auto"
				>#${display}</a>`;
					} else if (config.trigger === '/') {
						htmlToInsert = display;
					} else {
						const mainUsername = suggestion.id.startsWith(displayPrefix) ? suggestion.id.substring(displayPrefix.length) : null;
						const userDisplayName = display;

						if (suggestion.isRole) {
							htmlToInsert = mainUsername
								? `${displayPrefix}${mainUsername}`
								: `<a
            class="text-entity-link mention"
            data-entity-type="MessageEntityMentionRole"
            data-user-id="${suggestion.id}"
            contenteditable="false"
            dir="auto"
          >${displayPrefix}${userDisplayName}</a>`;
						} else {
							htmlToInsert = mainUsername
								? `${displayPrefix}${mainUsername}`
								: `<a
            class="text-entity-link mention"
            data-entity-type="MessageEntityMentionName"
            data-user-id="${suggestion.id}"
            contenteditable="false"
            dir="auto"
          >${suggestion.id !== ID_MENTION_HERE ? displayPrefix : ''}${userDisplayName}</a>`;
						}
					}
				}

				const inputEl = inputRef.current;

				if (!skipFocus) {
					inputEl.focus();
				}

				const htmlBeforeSelection = getHtmlBeforeSelection(inputEl);
				const fixedHtmlBeforeSelection = cleanWebkitNewLines(htmlBeforeSelection);
				const atIndex = fixedHtmlBeforeSelection.lastIndexOf(config.trigger);

				if (atIndex !== -1) {
					let shiftCaretPosition: number;
					if (markup !== `${config.trigger}[__display__](__id__)`) {
						if (config.trigger === ':' && markup === '::[__display__](__id__)') {
							const emojiDisplayLength = display.length + 2;
							shiftCaretPosition = emojiDisplayLength - (fixedHtmlBeforeSelection.length - atIndex);
						} else {
							const displayTextLength = display.length;
							shiftCaretPosition = displayTextLength - (fixedHtmlBeforeSelection.length - atIndex);
						}
					} else {
						if (config.trigger === '/') {
							shiftCaretPosition = display.length - (fixedHtmlBeforeSelection.length - atIndex);
						} else {
							const mainUsername = suggestion.id.startsWith(displayPrefix) ? suggestion.id.substring(displayPrefix.length) : null;
							const userDisplayName = display;
							shiftCaretPosition =
								(mainUsername ? mainUsername.length + displayPrefix.length : userDisplayName.length + displayPrefix.length) -
								(fixedHtmlBeforeSelection.length - atIndex);
							suggestion.id === ID_MENTION_HERE && (shiftCaretPosition -= 1);
						}
					}

					const shouldAddSpace = config.appendSpaceOnAdd !== false;
					const spaceToAdd = shouldAddSpace ? '&nbsp;' : '';
					const newHtml = `${fixedHtmlBeforeSelection.substr(0, atIndex)}${htmlToInsert}${spaceToAdd}`;
					const htmlAfterSelection = cleanWebkitNewLines(inputEl.innerHTML).substring(fixedHtmlBeforeSelection.length);
					const caretPosition = getCaretPosition(inputEl);

					const finalHtml = `${newHtml}${htmlAfterSelection}`;
					setHtml(finalHtml);
					inputEl.innerHTML = finalHtml;
					onChange?.(finalHtml);

					requestNextMutation(() => {
						inputEl.focus();

						if (!positionCaretAfterEmoji(inputEl, config, markup)) {
							const spaceOffset = shouldAddSpace ? 1 : 0;
							const newCaretPosition = caretPosition + shiftCaretPosition + spaceOffset;
							if (newCaretPosition >= 0) {
								setCaretPosition(inputEl, newCaretPosition);
							}
						}
					});

					config.onAdd?.(suggestion.id, display, atIndex, atIndex + htmlToInsert.length);
				}
			},
			[onChange, setHtml]
		);

		const saveCaretPosition = useCallback(() => {
			if (!inputRef.current) return;

			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				if (inputRef.current.contains(range.commonAncestorContainer)) {
					savedCaretPositionRef.current = {
						range: range.cloneRange(),
						inputHtml: inputRef.current.innerHTML
					};
				}
			}
		}, []);

		const restoreCaretPosition = useCallback(() => {
			if (!inputRef.current || !savedCaretPositionRef.current) return false;

			try {
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(savedCaretPositionRef.current.range);
					return true;
				}
			} catch (error) {
				console.warn('Could not restore caret position:', error);
			}
			return false;
		}, []);

		const insertEmoji = useCallback(
			(emojiId: string, emojiDisplay: string) => {
				if (!inputRef.current) {
					return;
				}

				const inputEl = inputRef.current;

				inputEl.focus();

				const selection = window.getSelection();
				const hasSelection = selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed;

				if (!hasSelection && savedCaretPositionRef.current) {
					const restored = restoreCaretPosition();
					if (!restored) {
						const range = document.createRange();
						range.selectNodeContents(inputEl);
						range.collapse(false);
						selection?.removeAllRanges();
						selection?.addRange(range);
					}
				}

				const htmlToInsert = `<span
			data-entity-type="MessageEntityCustomEmoji"
			data-document-id="${emojiId}"
			contenteditable="false"
			class="text-entity-emoji"
			dir="auto"
		>${emojiDisplay}</span>&nbsp;`;

				insertHtmlInSelection(htmlToInsert);

				const newHtml = inputEl.innerHTML;
				setHtml(newHtml);
				onChange?.(newHtml);

				savedCaretPositionRef.current = null;
			},
			[onChange, setHtml, restoreCaretPosition]
		);

		const insertMentionCommand = useCallback(
			(content: string, clearOldValue = false) => {
				if (!inputRef.current) {
					return;
				}

				const inputEl = inputRef.current;
				inputEl.focus();

				if (clearOldValue) {
					inputEl.innerHTML = '';
					setHtml('');
				}

				const range = document.createRange();
				range.selectNodeContents(inputEl);
				range.collapse(false);

				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);

				const htmlToInsert = content;
				insertHtmlInSelection(htmlToInsert);

				const newHtml = inputEl.innerHTML;
				setHtml(newHtml);
				onChange?.(newHtml);

				requestNextMutation(() => {
					const finalRange = document.createRange();
					finalRange.selectNodeContents(inputEl);
					finalRange.collapse(false);

					const finalSelection = window.getSelection();
					finalSelection?.removeAllRanges();
					finalSelection?.addRange(finalRange);
				});
			},
			[onChange, setHtml]
		);

		const handleSuggestionsChange = useCallback(
			(count: number, isLoading: boolean) => {
				setSuggestionsCount(count);
				if (activeMentionContext) {
					setActiveMentionContext((prev) =>
						prev
							? {
									...prev,
									mentionState: {
										...prev.mentionState,
										isActive: count > 0 || isLoading,
										isLoading
									}
								}
							: null
					);
				}
			},
			[activeMentionContext]
		);

		const handleMentionSelect = useCallback(
			(suggestion: MentionData) => {
				if (!inputRef.current || !activeMentionContext) {
					return;
				}

				const { config } = activeMentionContext;
				insertMentionDirectly(suggestion, config);
				setActiveMentionContext(null);
			},
			[activeMentionContext, insertMentionDirectly]
		);

		useImperativeHandle(
			ref,
			() => ({
				insertEmoji,
				insertMentionCommand,
				saveCaretPosition,
				focus: () => {
					inputRef.current?.focus();
				},
				blur: () => {
					inputRef.current?.blur();
				},
				getElement: () => {
					return inputRef.current;
				},
				undo,
				redo,
				canUndo,
				canRedo
			}),
			[insertEmoji, insertMentionCommand, saveCaretPosition, undo, redo, canUndo, canRedo]
		);

		const handleSuggestionMouseEnter = useCallback(
			(index: number) => {
				if (activeMentionContext) {
					setActiveMentionContext((prev) =>
						prev
							? {
									...prev,
									mentionState: {
										...prev.mentionState,
										selectedIndex: index
									}
								}
							: null
					);
				}
			},
			[activeMentionContext]
		);

		const handlePaste = useCallback(
			(e: React.ClipboardEvent<HTMLDivElement>) => {
				if (!e.clipboardData || disabled) {
					return;
				}

				e.preventDefault();

				const items = e.clipboardData.items;
				let hasImageFiles = false;

				if (items) {
					for (let i = 0; i < items.length; i++) {
						if (items[i].type.indexOf('image') !== -1) {
							hasImageFiles = true;
							break;
						}
					}

					if (hasImageFiles) {
						if (onHandlePaste) {
							onHandlePaste(e);
						}
						return;
					}
				}

				const htmlContent = e.clipboardData.getData('text/html');
				const plainText = e.clipboardData.getData('text/plain');

				const containsMentionEntities =
					htmlContent &&
					(htmlContent.includes('data-entity-type="MessageEntityMentionName"') ||
						htmlContent.includes('data-entity-type="MessageEntityMentionRole"') ||
						htmlContent.includes('data-entity-type="MessageEntityCustomEmoji"') ||
						htmlContent.includes('data-entity-type="MessageEntityHashtag"') ||
						htmlContent.includes('data-document-id='));

				let contentToInsert: string;

				if (containsMentionEntities && htmlContent) {
					const cleanedHtml = preparePastedHtml(htmlContent);
					contentToInsert = cleanedHtml;
				} else if (htmlContent) {
					const pastedFormattedText = parseHtmlAsFormattedText(preparePastedHtml(htmlContent), false, true);

					if (pastedFormattedText?.entities?.length) {
						contentToInsert = (renderText(pastedFormattedText.text, ['escape_html', 'br_html']) as string[])
							.join('')
							.replace(/\u200b+/g, '\u200b');
					} else {
						contentToInsert = (renderText(plainText || '', ['escape_html', 'br_html']) as string[])
							.join('')
							.replace(/\u200b+/g, '\u200b');
					}
				} else {
					if (!plainText) {
						return;
					}
					contentToInsert = (renderText(plainText, ['escape_html', 'br_html']) as string[]).join('').replace(/\u200b+/g, '\u200b');
				}

				insertHtmlInSelection(contentToInsert);
				inputRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
				setHtml(e.currentTarget.innerHTML);
				onChange?.(e.currentTarget.innerHTML);
				debouncedDetectMention();
			},
			[disabled, onChange, debouncedDetectMention, onHandlePaste]
		);

		const handleInput = useCallback(
			(e: React.FormEvent<HTMLDivElement>) => {
				let newHtml = e.currentTarget.innerHTML;
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = newHtml;
				const textContent = tempDiv.textContent || tempDiv.innerText || '';

				if (!textContent.trim()) {
					newHtml = '';
					e.currentTarget.innerHTML = '';
				}

				if (enableUndoRedo && html !== newHtml) {
					addToHistory(html);
				}

				setHtml(newHtml);
				onChange?.(newHtml);

				debouncedDetectMention();
			},
			[onChange, debouncedDetectMention, enableUndoRedo, html, addToHistory]
		);

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLDivElement>) => {
				const isComposing = (e.nativeEvent as any)?.isComposing || (e as any).isComposing;

				if (disabled || isComposing) {
					return;
				}

				if (enableUndoRedo && (e.ctrlKey || e.metaKey)) {
					if (e.key === 'z' || e.key === 'Z') {
						if (e.shiftKey) {
							e.preventDefault();
							redo();
							return;
						} else {
							e.preventDefault();
							undo();
							return;
						}
					}
					if (e.key === 'y' || e.key === 'Y') {
						e.preventDefault();
						redo();
						return;
					}
				}

				if (activeMentionContext?.mentionState.isActive) {
					if (e.key === 'ArrowDown') {
						e.preventDefault();
						setActiveMentionContext((prev) => {
							if (prev) {
								const currentIndex = prev.mentionState.selectedIndex;
								const maxIndex = Math.max(0, suggestionsCount - 1);
								const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;

								return {
									...prev,
									mentionState: {
										...prev.mentionState,
										selectedIndex: nextIndex
									}
								};
							}
							return null;
						});
						return;
					}
					if (e.key === 'ArrowUp') {
						e.preventDefault();
						setActiveMentionContext((prev) => {
							if (prev) {
								const currentIndex = prev.mentionState.selectedIndex;
								const maxIndex = Math.max(0, suggestionsCount - 1);
								const prevIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;

								return {
									...prev,
									mentionState: {
										...prev.mentionState,
										selectedIndex: prevIndex
									}
								};
							}
							return null;
						});
						return;
					}
					if (e.key === 'Escape') {
						e.preventDefault();
						setActiveMentionContext(null);
						return;
					}
					if (e.key === 'Enter' || e.key === 'Tab') {
						e.preventDefault();
						setTriggerSelection(true);
						return;
					}
				}

				if (!isComposing && e.key === 'Enter') {
					if (
						!isMobile &&
						((messageSendKeyCombo === 'enter' && !e.shiftKey) || (messageSendKeyCombo === 'ctrl-enter' && (e.ctrlKey || e.metaKey)))
					) {
						e.preventDefault();
						if (onSend && (html.trim() || hasFilesToSend)) {
							const formattedText = parseHtmlAsFormattedText(html, true, false) as FormattedText;
							const hasActualContent = formattedText.text.trim().length > 0;
							if (hasActualContent || hasFilesToSend) {
								onSend(formattedText);
								setHtml('');
								if (inputRef.current) {
									inputRef.current.innerHTML = '';
								}
							}
						}
						return;
					}
				}

				if ((e.ctrlKey || e.metaKey) && !e.altKey) {
					let handled = false;

					switch (e.key.toLowerCase()) {
						case 'b': {
							e.preventDefault();
							document.execCommand('bold', false);
							handled = true;
							break;
						}
						case 'i':
						case 'u':
						case 's': {
							//  Update: italic, underline, strike format later
							e.preventDefault();
							handled = true;
							break;
						}
					}

					if (handled) {
						setTimeout(() => {
							if (inputRef.current) {
								setHtml(inputRef.current.innerHTML);
								onChange?.(inputRef.current.innerHTML);
							}
						}, 0);
					}
				}
				onKeyDown?.(e);
			},
			[activeMentionContext, onSend, html, messageSendKeyCombo, isMobile, disabled, onChange, onKeyDown, enableUndoRedo, undo, redo]
		);

		const mentionContent = useMemo(() => {
			if (!activeMentionContext) return null;

			return Children.map(children, (child) => {
				if (isValidElement(child) && typeof child.type === 'function') {
					const childConfig = child.props as MentionProps;

					if (activeMentionContext?.trigger === childConfig.trigger) {
						return cloneElement(child, {
							...child.props,
							mentionState: activeMentionContext.mentionState,
							onSelect: handleMentionSelect,
							onMouseEnter: handleSuggestionMouseEnter,
							onSuggestionsChange: handleSuggestionsChange,
							suggestionsClassName,
							suggestionStyle,
							triggerSelection,
							onSelectionTriggered: () => setTriggerSelection(false)
						} as MentionProps);
					}
				}
				return null;
			});
		}, [
			activeMentionContext,
			children,
			handleMentionSelect,
			handleSuggestionMouseEnter,
			handleSuggestionsChange,
			suggestionsClassName,
			suggestionStyle,
			triggerSelection
		]);

		const { refs, floatingStyles } = useFloating({
			open: !!activeMentionContext,
			placement: 'top-start',
			middleware: [offset({ mainAxis: 8, crossAxis: -55 }), flip(), shift({ padding: 8 })],
			whileElementsMounted: autoUpdate
		});

		useEffect(() => {
			if (activeMentionContext && inputRef.current) {
				const parentElement = inputRef.current.closest('.max-w-wrappBoxChatViewMobile, .w-wrappBoxChatView');
				const width = parentElement ? parentElement.getBoundingClientRect().width : inputRef.current.getBoundingClientRect().width;
				setInputWidth(width);
			}
		}, [activeMentionContext]);

		const tooltipOverlay = useMemo(() => {
			return (
				<div
					ref={(node) => {
						refs.setFloating(node);
						(popoverRef as any).current = node;
					}}
					className="mention-popover-container bg-ping-member mt-[-5px] z-[999]"
					style={{
						...floatingStyles,
						borderRadius: '8px',
						border: '1px solid var(--border-color)',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
						padding: 0,
						width: inputWidth,
						display: activeMentionContext ? 'block' : 'none'
					}}
				>
					{mentionContent}
				</div>
			);
		}, [mentionContent, refs.setFloating, floatingStyles, activeMentionContext, inputWidth]);

		return (
			<div className={`mention-input ${className}`} style={{ position: 'relative', ...style }}>
				<div
					ref={(node) => {
						(inputRef as any).current = node;
						refs.setReference(node);
					}}
					id={id}
					contentEditable={!disabled}
					className="mention-input-editor"
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					onBlur={saveCaretPosition}
					onMouseUp={saveCaretPosition}
					onKeyUp={saveCaretPosition}
					data-placeholder={placeholder}
					suppressContentEditableWarning={true}
					role="textbox"
					dir="auto"
					tabIndex={0}
					aria-label="Message"
					style={{
						outline: 'none'
					}}
					data-e2e={generateE2eId('mention.input')}
				/>
				{activeMentionContext && (createPortal(tooltipOverlay, document.body) as React.ReactElement)}
			</div>
		);
	}
);

MentionsInput.displayName = 'MentionsInput';

export default MentionsInput;
