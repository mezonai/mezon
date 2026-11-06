import { useChatSending } from '@mezon/core';
import { selectSession } from '@mezon/store';
import type { IMessageSendPayload, ThreadValue } from '@mezon/utils';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { MessageBox } from '../../MessageBox';
import { UserMentionList } from '../../UserMentionList';

interface DirectIdProps {
	// directParamId: string;
	mode: number;
	direct: ApiChannelDescription;
}
export function DirectMessageBox({ mode, direct }: DirectIdProps) {
	const directParamId = useMemo(() => {
		return direct?.channel_id ?? '';
	}, [direct?.channel_id]);

	const { sendMessage, sendMessageTyping } = useChatSending({ channelOrDirect: direct, mode });
	// TODO: move selector to store
	const sessionUser = useSelector(selectSession);

	const chatboxRef = useRef<HTMLDivElement | null>(null);

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			anonymous?: boolean,
			mentionEveryone?: boolean,
			displayName?: string,
			clanNick?: string,
			ephemeralReceiverId?: string
		) => {
			if (sessionUser) {
				sendMessage(content, mentions, attachments, references, false, mentionEveryone, false, undefined, ephemeralReceiverId);
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

	return (
		<div className="mx-3 relative" ref={chatboxRef}>
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
