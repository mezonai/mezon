import {
	referencesActions,
	selectAttachmentData,
	selectDataReferences,
	selectIdMessageRefReaction,
	selectIdMessageRefReply,
	selectIdMessageReplied,
	selectOpenEditMessageState,
	selectOpenOptionMessageState,
	selectOpenReplyMessageState,
	selectOpenThreadMessageState,
	selectReferenceMessage,
	threadsActions,
	useAppDispatch,
} from '@mezon/store';
import { IMessageWithUser } from '@mezon/utils';
import { ApiMessageAttachment, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useReference() {
	const dispatch = useAppDispatch();
	const referenceMessage = useSelector(selectReferenceMessage);
	const dataReferences = useSelector(selectDataReferences);
	const idMessageReplied = useSelector(selectIdMessageReplied);
	const openEditMessageState = useSelector(selectOpenEditMessageState);
	const openReplyMessageState = useSelector(selectOpenReplyMessageState);
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const attachmentDataRef = useSelector(selectAttachmentData);
	const openOptionMessageState = useSelector(selectOpenOptionMessageState);
	const idMessageRefReply = useSelector(selectIdMessageRefReply);
	const idMessageRefReaction = useSelector(selectIdMessageRefReaction);

	const setReferenceMessage = useCallback(
		(message: IMessageWithUser | null) => {
			dispatch(referencesActions.setReferenceMessage(message));
		},
		[dispatch],
	);

	const setDataReferences = useCallback(
		(dataReference: ApiMessageRef[]) => {
			dispatch(referencesActions.setDataReferences(dataReference));
		},
		[dispatch],
	);

	const setIdMessageToJump = useCallback(
		(idMessageToJump: string) => {
			dispatch(referencesActions.setIdMessageToJump(idMessageToJump));
		},
		[dispatch],
	);

	const setOpenEditMessageState = useCallback(
		(status: boolean) => {
			dispatch(referencesActions.setOpenEditMessageState(status));
		},
		[dispatch],
	);

	const setOpenReplyMessageState = useCallback(
		(status: boolean) => {
			dispatch(referencesActions.setOpenReplyMessageState(status));
		},
		[dispatch],
	);

	const setOpenThreadMessageState = useCallback(
		(status: boolean) => {
			dispatch(threadsActions.setOpenThreadMessageState(status));
		},
		[dispatch],
	);

	const setAttachmentData = useCallback(
		(attachent: ApiMessageAttachment | ApiMessageAttachment[]) => {
			dispatch(referencesActions.setAttachmentData(attachent));
		},
		[dispatch],
	);

	const setIdReferenceMessageReply = useCallback(
		(idMessageRefReply: string) => {
			dispatch(referencesActions.setIdReferenceMessageReply(idMessageRefReply));
		},
		[dispatch],
	);

	const setIdReferenceMessageReaction = useCallback(
		(idMessageRefReaction: string) => {
			dispatch(referencesActions.setIdReferenceMessageReaction(idMessageRefReaction));
		},
		[dispatch],
	);

	return useMemo(
		() => ({
			setReferenceMessage,
			setDataReferences,
			setIdMessageToJump,
			setOpenEditMessageState,
			setOpenReplyMessageState,
			setOpenThreadMessageState,
			referenceMessage,
			dataReferences,
			idMessageReplied,
			openEditMessageState,
			openReplyMessageState,
			openThreadMessageState,
			attachmentDataRef,
			setAttachmentData,
			openOptionMessageState,
			idMessageRefReply,
			setIdReferenceMessageReply,
			idMessageRefReaction,
			setIdReferenceMessageReaction,
		}),
		[
			setReferenceMessage,
			setDataReferences,
			setIdMessageToJump,
			setOpenEditMessageState,
			setOpenReplyMessageState,
			setOpenThreadMessageState,
			referenceMessage,
			dataReferences,
			idMessageReplied,
			openEditMessageState,
			openReplyMessageState,
			openThreadMessageState,
			attachmentDataRef,
			setAttachmentData,
			openOptionMessageState,
			idMessageRefReply,
			setIdReferenceMessageReply,
			idMessageRefReaction,
			setIdReferenceMessageReaction,
		],
	);
}
