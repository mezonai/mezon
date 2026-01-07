import { IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMessageParser } from '../../../hooks/useMessageParser';
import { MessageAttachment } from '../../home/homedrawer/components/MessageAttachment';
import { RenderTextMarkdownContent } from '../../home/homedrawer/components/RenderTextMarkdown';

interface IMessageNotificationProps {
	message: IMessageWithUser;
}
const MessageWebhookClan = React.memo(({ message }: IMessageNotificationProps) => {
	const { t } = useTranslation('message');
	const { attachments } = useMessageParser(message);
	const isEdited = useMemo(() => {
		if (message?.updateTimeSeconds) {
			return message.updateTimeSeconds > message.createTimeSeconds;
		}
		return false;
	}, [message?.updateTimeSeconds, message?.createTimeSeconds]);

	return (
		<View>
			{attachments?.length ? (
				<MessageAttachment
					attachments={message?.attachments || []}
					clanId={message?.clanId}
					channelId={message?.channelId}
					messageCreatTime={message?.createTimeSeconds}
					senderId={message?.senderId}
				/>
			) : null}
			<View>
				<RenderTextMarkdownContent
					content={{
						...(typeof message.content === 'object' ? message.content : {}),
						mentions: message?.mentions
					}}
					isEdited={isEdited}
					isNumberOfLine
					translate={t}
					isMessageReply={false}
					mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
				/>
			</View>
		</View>
	);
});

export default MessageWebhookClan;
