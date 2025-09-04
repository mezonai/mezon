import { RequestInput } from '@mezon/utils';
import { KeyboardEvent, RefObject, useCallback } from 'react';

interface UseKeyboardHandlerProps {
	editorRef: RefObject<HTMLDivElement | null>;
	updateDraft: (request: RequestInput) => void;
	anonymousMode: boolean;
	isEphemeralMode?: boolean;
	setIsEphemeralMode?: (mode: boolean) => void;
	setEphemeralTargetUserId?: (userId: string | null) => void;
	setEphemeralTargetUserDisplay?: (display: string | null) => void;
	ephemeralTargetUserId?: string | null;
}

export const useKeyboardHandler = ({
	editorRef,
	updateDraft,
	anonymousMode,
	isEphemeralMode,
	setIsEphemeralMode,
	setEphemeralTargetUserId,
	setEphemeralTargetUserDisplay,
	ephemeralTargetUserId
}: UseKeyboardHandlerProps) => {
	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement | HTMLTextAreaElement | HTMLInputElement>): void => {
			const { key, ctrlKey, shiftKey, metaKey } = event;
			switch (key) {
				case 'Escape': {
					if (
						(isEphemeralMode || ephemeralTargetUserId) &&
						setIsEphemeralMode &&
						setEphemeralTargetUserId &&
						setEphemeralTargetUserDisplay
					) {
						setIsEphemeralMode(false);
						setEphemeralTargetUserId(null);
						setEphemeralTargetUserDisplay(null);
						updateDraft({
							valueTextInput: '',
							content: '',
							mentionRaw: []
						});
					}
					return;
				}
				case 'Enter': {
				}
				default: {
					return;
				}
			}
		},
		[
			anonymousMode,
			updateDraft,
			editorRef,
			isEphemeralMode,
			setIsEphemeralMode,
			setEphemeralTargetUserId,
			setEphemeralTargetUserDisplay,
			ephemeralTargetUserId
		]
	);

	return { onKeyDown };
};
