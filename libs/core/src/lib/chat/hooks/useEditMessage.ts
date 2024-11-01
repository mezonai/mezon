import {
	messagesActions,
	referencesActions,
	selectChannelById,
	selectDirectById,
	selectIdMessageRefEdit,
	selectOpenEditMessageState,
	useAppSelector
} from '@mezon/store';
import { IMessageSendPayload, IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useChatSending } from './useChatSending';

export const useEditMessage = (channelId: string, channelLabel: string, mode: number, message: IMessageWithUser) => {
	const clanIdInMes = useMemo(() => {
		return message.clan_id;
	}, [message.clan_id]);
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
			attachmentsOnMessage: ApiMessageAttachment[]
		) => {
			dispatch(
				messagesActions.setChannelDraftMessage({
					channelId: channelId as string,
					channelDraftMessage: {
						message_id: message_id,
						draftContent: draftContent,
						draftMention: draftMention,
						draftAttachment: attachmentsOnMessage
					}
				})
			);
		},
		[dispatch]
	);

	const handleSend = useCallback(
		(editMessage: IMessageSendPayload, messageId: string, draftMention: ApiMessageMention[]) => {
			editSendMessage(editMessage, messageId, draftMention, attachmentsOnMessage, false);
			setChannelDraftMessage(channelId, messageId, editMessage, draftMention, attachmentsOnMessage ?? []);
			dispatch(referencesActions.setOpenEditMessageState(false));
		},
		[editSendMessage, attachmentsOnMessage, setChannelDraftMessage, channelId, dispatch, clanIdInMes, mode, message]
	);

	return {
		openEditMessageState,
		idMessageRefEdit,
		handleCancelEdit,
		handleSend,
		setChannelDraftMessage
	};
};
