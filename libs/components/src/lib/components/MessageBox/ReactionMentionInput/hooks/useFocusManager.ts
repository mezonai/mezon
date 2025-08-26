import { CHANNEL_INPUT_ID, GENERAL_INPUT_ID } from '@mezon/utils';
import { RefObject, useEffect } from 'react';

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
	const getTargetInputId = () => {
		return isTopic ? GENERAL_INPUT_ID : CHANNEL_INPUT_ID;
	};

	const focusEditor = (isAttachment = false) => {
		if (editorRef.current && editorRef.current.id === getTargetInputId()) {
			editorRef.current.focus();
		}
	};

	const blurEditor = () => {
		if (editorRef.current) {
			editorRef.current.blur();
		}
	};

	// Handle focus when reference message changes or edit state changes
	useEffect(() => {
		if ((isMenuClosed && isStatusMenuOpen) || isEditMessageOpen) {
			blurEditor();
			return;
		}

		if (messageRefId || (isEmojiPickerActive && !isReactionRightActive) || (!isEditMessageOpen && !editMessageId)) {
			focusEditor();
		}
	}, [messageRefId, isEditMessageOpen, editMessageId, isEmojiPickerActive, isReactionRightActive, isMenuClosed, isStatusMenuOpen]);

	// Handle focus when channel or DM group changes
	useEffect(() => {
		if ((currentChannelId !== undefined || currentDmGroupId !== undefined) && !isMenuClosed) {
			focusEditor();
		}
	}, [currentChannelId, currentDmGroupId, isMenuClosed]);

	// Handle focus when attachments are added
	useEffect(() => {
		if (hasAttachments) {
			focusEditor(true);
		}
	}, [hasAttachments]);

	// Handle aria-hidden attribute removal
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.removeAttribute('aria-hidden');
		}
	}, []);

	return {
		focusEditor,
		blurEditor,
		getTargetInputId
	};
};
