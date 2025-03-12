import { AttachmentImageIcon } from '@mezon/mobile-components';
import { Colors } from '@mezon/mobile-ui';
import { IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { RenderTextMarkdownContent } from '../../home/homedrawer/components/RenderTextMarkdown';
import { styles } from './MessageNotification.styles';

interface IMessageNotificationProps {
	message: IMessageWithUser;
}
const MessageNotification = React.memo(({ message }: IMessageNotificationProps) => {
	const { t } = useTranslation('message');

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
			{message?.attachments?.length ? (
				<View style={styles.attachmentBox}>
					<Text style={styles.tapToSeeAttachmentText}>{t('tapToSeeAttachment')}</Text>
					<AttachmentImageIcon width={13} height={13} color={Colors.textGray} />
				</View>
			) : null}
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
	);
});

export default MessageNotification;
