import {
	messagesActions,
	referencesActions,
	selectChannelById,
	selectDirectById,
	selectIdMessageRefEdit,
	selectMessageByMessageId,
	selectOpenEditMessageState,
	useAppSelector
} from '@mezon/store';
import type { IMessageSendPayload, IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useChatSending } from './useChatSending';

export const useEditMessage = (channelId: string, channelLabel: string, mode: number, message: IMessageWithUser) => {
	const attachmentsOnMessage = useMemo(() => {
		return message.attachments;
	}, [message.attachments]);

	const selectedChannel = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const selectedDirect = useAppSelector((state) => selectDirectById(state, channelId));

	const currentDirectOrChannel = useMemo(() => {
		if (mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD) {
			return selectedChannel;
		} else {
			return selectedDirect;
		}
	}, [mode, selectedChannel, selectedDirect]);

	const dispatch = useDispatch();
	const { editSendMessage } = useChatSending({ channelOrDirect: currentDirectOrChannel, mode });
	const oldMentionsString = useAppSelector((state) => {
		const entity = selectMessageByMessageId(state, channelId, message?.id || '');
		return entity?.mentions ? JSON.stringify(entity.mentions) : '';
	});
	const openEditMessageState = useSelector(selectOpenEditMessageState);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);

	const handleCancelEdit = useCallback(() => {
		dispatch(referencesActions.setIdReferenceMessageEdit(''));
		dispatch(messagesActions.deleteChannelDraftMessage({ channelId }));
		dispatch(referencesActions.setOpenEditMessageState(false));
	}, [channelId, dispatch]);

	const setChannelDraftMessage = useCallback(
		(
			channelId: string,
			message_id: string,
			draftContent: IMessageSendPayload,
			draftMention: ApiMessageMention[],
			attachmentsOnMessage: ApiMessageAttachment[],
			draftTopicId: string
		) => {
			dispatch(
				messagesActions.setChannelDraftMessage({
					channelId: channelId as string,
					channelDraftMessage: {
						message_id,
						draftContent,
						draftMention,
						draftAttachment: attachmentsOnMessage,
						draftTopicId
					}
				})
			);
		},
		[dispatch]
	);

	const handleSend = useCallback(
		(editMessage: IMessageSendPayload, messageId: string, draftMention: ApiMessageMention[], topic_id: string, isTopic?: boolean) => {
			const oldMentions = oldMentionsString;
			editSendMessage(editMessage, messageId, draftMention, attachmentsOnMessage, false, topic_id, isTopic, oldMentions);
			setChannelDraftMessage(channelId, messageId, editMessage, draftMention, attachmentsOnMessage ?? [], topic_id as string);
			dispatch(referencesActions.setOpenEditMessageState(false));
		},
		[editSendMessage, attachmentsOnMessage, setChannelDraftMessage, channelId, dispatch, oldMentionsString]
	);

	return {
		openEditMessageState,
		idMessageRefEdit,
		handleCancelEdit,
		handleSend,
		setChannelDraftMessage
	};
};
