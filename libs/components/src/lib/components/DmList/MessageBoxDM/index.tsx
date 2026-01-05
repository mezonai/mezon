import { useChatSending, useEscapeKey } from '@mezon/core';
import { referencesActions, selectDataReferences, selectSession, useAppDispatch, useAppSelector } from '@mezon/store';
import type { IMessageSendPayload } from '@mezon/utils';
import { blankReferenceObj } from '@mezon/utils';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { MessageBox } from '../../MessageBox';
import { ReplyMessageBox } from '../../ReplyMessageBox';
import { UserMentionList } from '../../UserMentionList';

interface DirectIdProps {
	// directParamId: string;
	mode: number;
	direct: ApiChannelDescription;
}
export function DirectMessageBox({ mode, direct }: DirectIdProps) {
	const directParamId = useMemo(() => {
		return direct?.channelId ?? '';
	}, [direct?.channelId]);

	const { sendMessage, sendMessageTyping } = useChatSending({ channelOrDirect: direct, mode });
	// TODO: move selector to store
	const sessionUser = useSelector(selectSession);
	const dataReferences = useAppSelector((state) => selectDataReferences(state, directParamId ?? ''));
	const dispatch = useAppDispatch();

	const chatboxRef = useRef<HTMLDivElement | null>(null);

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (sessionUser) {
				sendMessage(content, mentions, attachments, references);
			} else {
				console.error('Session is not available');
			}
		},
		[sendMessage, sessionUser]
	);

	const handleTyping = useCallback(() => {
		sendMessageTyping();
	}, [sendMessageTyping]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	const handleCloseReplyMessageBox = useCallback(() => {
		dispatch(
			referencesActions.setDataReferences({
				channelId: directParamId ?? '',
				dataReferences: blankReferenceObj
			})
		);
	}, [dataReferences.messageRefId]);

	useEscapeKey(handleCloseReplyMessageBox, { preventEvent: !dataReferences.messageRefId });

	return (
		<div className="mx-3 relative" ref={chatboxRef}>
			{dataReferences.messageRefId && <ReplyMessageBox channelId={directParamId ?? ''} dataReferences={dataReferences} />}
			<MessageBox
				onSend={handleSend}
				currentChannelId={directParamId}
				onTyping={handleTypingDebounced}
				listMentions={UserMentionList({ channelID: directParamId ?? '', channelMode: mode })}
				mode={mode}
			/>
		</div>
	);
}

DirectMessageBox.Skeleton = () => {
	return (
		<div>
			<MessageBox.Skeleton />
		</div>
	);
};

export default memo(DirectMessageBox);
