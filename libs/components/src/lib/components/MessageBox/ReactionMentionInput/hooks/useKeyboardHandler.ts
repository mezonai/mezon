import { getStore, referencesActions, selectAttachmentByChannelId, useAppDispatch } from '@mezon/store';
import type { RequestInput } from '@mezon/utils';
import type { KeyboardEvent, RefObject } from 'react';
import { useCallback } from 'react';

interface UseKeyboardHandlerProps {
	editorRef: RefObject<HTMLDivElement | null>;
	updateDraft: (request: RequestInput) => void;
	anonymousMode: boolean;
	isEphemeralMode?: boolean;
	setIsEphemeralMode?: (mode: boolean) => void;
	setEphemeralTargetUserId?: (userId: string | null) => void;
	setEphemeralTargetUserDisplay?: (display: string | null) => void;
	ephemeralTargetUserId?: string | null;
	channelId?: string;
}

export const useKeyboardHandler = ({
	editorRef,
	updateDraft,
	anonymousMode,
	isEphemeralMode,
	setIsEphemeralMode,
	setEphemeralTargetUserId,
	setEphemeralTargetUserDisplay,
	ephemeralTargetUserId,
	channelId
}: UseKeyboardHandlerProps) => {
	const dispatch = useAppDispatch();
	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement | HTMLTextAreaElement | HTMLInputElement>): void => {
			const { key, ctrlKey, shiftKey, metaKey } = event;
			switch (key) {
				case 'Escape': {
					const store = getStore();
					const hasAttachment = selectAttachmentByChannelId(store.getState(), channelId ?? '');
					if (hasAttachment) {
						dispatch(referencesActions.clearAttachmentDraft(channelId as string));
						return;
					}

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
			ephemeralTargetUserId,
			channelId
		]
	);

	return { onKeyDown };
};
