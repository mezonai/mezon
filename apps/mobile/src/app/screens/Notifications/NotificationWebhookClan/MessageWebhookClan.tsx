import { SHARE_CONTACT_KEY, type IEmbedProps, type IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMessageParser } from '../../../hooks/useMessageParser';
import { ContactMessageCard, type IContactData } from '../../home/homedrawer/components/ContactMessageCard';
import { MessageAttachment } from '../../home/homedrawer/components/MessageAttachment';
import { RenderTextMarkdownContent } from '../../home/homedrawer/components/RenderTextMarkdown';

interface IMessageNotificationProps {
	message: IMessageWithUser & { embed: IEmbedProps };
}

const MessageWebhookClan = memo(({ message }: IMessageNotificationProps) => {
	const { t } = useTranslation('message');
	const { attachments } = useMessageParser(message);
	const isEdited = useMemo(() => {
		if (message?.update_time_seconds) {
			return message.update_time_seconds > message.create_time_seconds;
		}
		return false;
	}, [message?.update_time_seconds, message?.create_time_seconds]);

	const contactData = useMemo((): IContactData | null => {
		const embed = message?.embed?.[0];
		if (embed?.fields?.[0]?.value === SHARE_CONTACT_KEY) {
			return {
				user_id: embed?.fields?.[1]?.value || '',
				username: embed?.fields?.[2]?.value || '',
				display_name: embed?.fields?.[3]?.value || '',
				avatar: embed?.fields?.[4]?.value || ''
			};
		}
	}, [message?.embed?.[0]]);

	return (
		<View>
			{attachments?.length ? (
				<MessageAttachment
					attachments={message?.attachments || []}
					clanId={message?.clan_id}
					channelId={message?.channel_id}
					messageCreatTime={message?.create_time_seconds}
					senderId={message?.sender_id}
				/>
			) : null}
			{contactData ? <ContactMessageCard data={contactData} /> : null}

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
