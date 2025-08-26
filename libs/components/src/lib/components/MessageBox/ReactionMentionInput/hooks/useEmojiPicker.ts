import { emojiSuggestionActions } from '@mezon/store';
import { RefObject, useCallback } from 'react';
import type { MentionsInputHandle } from '../MentionsInput';

interface UseEmojiPickerProps {
	editorRef: RefObject<MentionsInputHandle>;
	emojiPicked: any;
	addEmojiState: any;
	dispatch: any;
	focusEditorIfMatch: (element: HTMLElement | null, targetInputId?: string) => void;
	onDirectEmojiInsert?: (emojiId: string, emojiShortname: string) => void;
}

export const useEmojiPicker = ({ editorRef, emojiPicked, addEmojiState, dispatch, focusEditorIfMatch, onDirectEmojiInsert }: UseEmojiPickerProps) => {

	const insertEmojiDirectly = useCallback((emojiId: string, emojiShortname: string) => {

		if (!editorRef?.current) {
			return;
		}

		editorRef.current.insertEmoji(emojiId, emojiShortname);
		dispatch(
			emojiSuggestionActions.setSuggestionEmojiObjPicked({
				shortName: '',
				id: '',
				isReset: true
			})
		);
	}, [editorRef, onDirectEmojiInsert, dispatch]);

	return {
		insertEmojiDirectly
	};
};
