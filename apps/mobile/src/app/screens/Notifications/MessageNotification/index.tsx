import { size, useTheme } from '@mezon/mobile-ui';
import type { IMentionOnMessage, IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { RenderTextMarkdownContent } from '../../home/homedrawer/components/RenderTextMarkdown';
import { style } from './MessageNotification.styles';

interface IMessageNotificationProps {
	message: IMessageWithUser;
	mentions: IMentionOnMessage[];
}
const MessageNotification = React.memo(({ message, mentions }: IMessageNotificationProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('message');

	const isEdited = useMemo(() => {
		if (message?.updateTimeSeconds) {
			return message.updateTimeSeconds > message.createTimeSeconds;
		}
		return false;
	}, [message?.updateTimeSeconds, message?.createTimeSeconds]);

	return (
		<View>
			{message?.attachments?.length ? (
				<View style={styles.attachmentBox}>
					<Text style={styles.tapToSeeAttachmentText}>{t('tapToSeeAttachment')}</Text>
					<MezonIconCDN icon={IconCDN.imageIcon} width={size.s_13} height={size.s_13} color={themeValue.textDisabled} />
				</View>
			) : null}
			<RenderTextMarkdownContent
				content={{
					...(typeof message.content === 'object' ? message.content : {}),
					mentions
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
