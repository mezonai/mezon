import { CHANNEL_INPUT_ID, GENERAL_INPUT_ID } from '@mezon/utils';
import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';

interface UseFocusManagerProps {
	editorRef: RefObject<HTMLDivElement>;
	isTopic: boolean;
	isMenuClosed: boolean;
	isStatusMenuOpen: boolean;
	messageRefId?: string;
	isEmojiPickerActive: boolean;
	isReactionRightActive: boolean;
	isEditMessageOpen: boolean;
	editMessageId?: string;
	currentChannelId?: string;
	currentDmGroupId?: string;
	hasAttachments: boolean;
}

export const useFocusManager = ({
	editorRef,
	isTopic,
	isMenuClosed,
	isStatusMenuOpen,
	messageRefId,
	isEmojiPickerActive,
	isReactionRightActive,
	isEditMessageOpen,
	editMessageId,
	currentChannelId,
	currentDmGroupId,
	hasAttachments
}: UseFocusManagerProps) => {
	const getTargetInputId = useCallback(() => {
		return isTopic ? GENERAL_INPUT_ID : CHANNEL_INPUT_ID;
	}, [isTopic]);

	const focusEditor = useCallback(() => {
		if (editorRef.current && editorRef.current.id === getTargetInputId()) {
			editorRef.current.focus();
		}
	}, [editorRef, getTargetInputId]);

	const blurEditor = useCallback(() => {
		if (editorRef.current) {
			editorRef.current.blur();
		}
	}, []);

	// Handle focus when reference message changes or edit state changes
	useEffect(() => {
		if ((isMenuClosed && isStatusMenuOpen) || isEditMessageOpen) {
			blurEditor();
			return;
		}

		if (messageRefId || (isEmojiPickerActive && !isReactionRightActive) || (!isEditMessageOpen && !editMessageId)) {
			focusEditor();
		}
	}, [
		messageRefId,
		isEditMessageOpen,
		editMessageId,
		isEmojiPickerActive,
		isReactionRightActive,
		isMenuClosed,
		isStatusMenuOpen,
		focusEditor,
		blurEditor
	]);

	// Handle focus when channel or DM group changes
	useEffect(() => {
		if ((currentChannelId !== undefined || currentDmGroupId !== undefined) && !isMenuClosed) {
			focusEditor();
		}
	}, [currentChannelId, currentDmGroupId, isMenuClosed, focusEditor]);

	// Handle focus when attachments are added
	useEffect(() => {
		if (hasAttachments) {
			focusEditor();
		}
	}, [hasAttachments, focusEditor]);

	// Handle aria-hidden attribute removal
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.removeAttribute('aria-hidden');
		}
	}, [editorRef]);

	useEffect(() => {
		const handleEscapeFocus = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;

			const activeElement = document.activeElement;
			const isNothingFocused = !activeElement || activeElement === document.body;

			if (isNothingFocused) {
				focusEditor();
			}
		};

		document.addEventListener('keydown', handleEscapeFocus);
		return () => {
			document.removeEventListener('keydown', handleEscapeFocus);
		};
	}, [focusEditor]);

	return {
		focusEditor,
		blurEditor,
		getTargetInputId
	};
};
