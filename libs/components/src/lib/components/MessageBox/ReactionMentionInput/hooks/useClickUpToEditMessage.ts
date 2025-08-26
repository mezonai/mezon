import { useClickUpToEdit } from '@mezon/core';
import { getStore, messagesActions, referencesActions, selectLassSendMessageEntityBySenderId } from '@mezon/store';
import { RequestInput } from '@mezon/utils';
import { RefObject, useCallback } from 'react';

interface UseClickUpToEditMessageProps {
	editorRef: RefObject<HTMLDivElement>;
	currentChannelId: string | undefined;
	userId: string | undefined;
	draftRequest?: RequestInput | null;
	dispatch: any;
}

export const useClickUpToEditMessage = ({ editorRef, currentChannelId, userId, draftRequest, dispatch }: UseClickUpToEditMessageProps) => {
	const clickUpToEditMessage = useCallback(() => {
		if (!currentChannelId || !userId) return;

		const store = getStore();
		const lastMessageByUserId = selectLassSendMessageEntityBySenderId(store.getState(), currentChannelId, userId);
		const idRefMessage = lastMessageByUserId?.id;

		if (idRefMessage && !draftRequest?.valueTextInput) {
			dispatch(referencesActions.setOpenEditMessageState(true));
			dispatch(referencesActions.setIdReferenceMessageEdit(lastMessageByUserId));
			dispatch(referencesActions.setIdReferenceMessageEdit(idRefMessage));
			dispatch(
				messagesActions.setChannelDraftMessage({
					channelId: currentChannelId,
					channelDraftMessage: {
						message_id: idRefMessage,
						draftContent: lastMessageByUserId?.content,
						draftMention: lastMessageByUserId.mentions ?? [],
						draftAttachment: lastMessageByUserId.attachments ?? [],
						draftTopicId: lastMessageByUserId.content.tp as string
					}
				})
			);
		}
	}, [currentChannelId, draftRequest?.valueTextInput, dispatch, userId]);

	useClickUpToEdit(editorRef as RefObject<HTMLElement>, draftRequest?.valueTextInput || '', clickUpToEditMessage);

	return { clickUpToEditMessage };
};
