import { IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMessageParser } from '../../../hooks/useMessageParser';
import { RenderTextMarkdownContent } from '../../home/homedrawer/components';
import { MessageAttachment } from '../../home/homedrawer/components/MessageAttachment';

interface IMessageNotificationProps {
	message: IMessageWithUser;
}
const MessageWebhookClan = React.memo(({ message }: IMessageNotificationProps) => {
	const { t } = useTranslation('message');
	const { attachments } = useMessageParser(message);
	const isEdited = useMemo(() => {
		if (message?.update_time) {
			const updateDate = new Date(message?.update_time);
			const createDate = new Date(message?.create_time);
			return updateDate > createDate;
		}
		return false;
	}, [message?.update_time, message?.create_time]);

	return (
		<View>
			{attachments?.length ? (
				<MessageAttachment attachments={message?.attachments || []} senderId={message?.sender_id} createTime={message?.create_time} />
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
