import { isEmpty, load, STORAGE_MY_USER_ID, validLinkGoogleMapRegex } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { isContainsUrl } from '@mezon/transport';
import { EMimeTypes } from '@mezon/utils';
import { ChannelType, safeJSONParse } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { MemberInvoiceStatus } from '../../components/MemberStatus/MemberInvoiceStatus';
import { DmListItemLastMessage } from './DMListItemLastMessage';
import { style } from './styles';

export const MessagePreviewLastest = React.memo(
	(props: { type: ChannelType; senderId: string; senderName: string; userId: string; lastSentMessageStr: string; isUnReadChannel: boolean }) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { lastSentMessageStr, type, senderId, senderName, userId, isUnReadChannel } = props || {};
		const lastSentMessage = useMemo(() => {
			return safeJSONParse(lastSentMessageStr || '{}');
		}, [lastSentMessageStr]);

		const content = useMemo(() => {
			return typeof lastSentMessage?.content === 'object' ? lastSentMessage?.content : safeJSONParse(lastSentMessage?.content || '{}');
		}, [lastSentMessage?.content]);

		const attachment = useMemo(() => {
			const messageAttachments =
				typeof lastSentMessage?.attachment === 'object' ? lastSentMessage?.attachment : safeJSONParse(lastSentMessage?.attachment || '{}');
			return Array.isArray(messageAttachments) ? messageAttachments?.[0] : messageAttachments;
		}, [lastSentMessage?.attachment]);

		const contentTextObj = useMemo(() => {
			const isLinkMessage = isContainsUrl(content?.t || '');
			return {
				text: content?.t || '',
				isLinkMessage
			};
		}, [content?.t]);

		const embed = useMemo(() => {
			return content?.embed?.[0];
		}, [content]);

		const isTypeDMGroup = useMemo(() => {
			return type === ChannelType.CHANNEL_TYPE_GROUP;
		}, [type]);
		const { t } = useTranslation(['message', 'common']);

		const isYourAccount = useMemo(() => {
			const userId = load(STORAGE_MY_USER_ID);
			return userId?.toString() === senderId?.toString();
		}, [senderId]);

		const renderLastMessageContent = useMemo(() => {
			if (!senderId) {
				return '';
			}

			if (isYourAccount) {
				return `${t('directMessage.you')}: `;
			}

			if (senderName) {
				return `${senderName}: `;
			}

			return '';
		}, [senderId, isYourAccount, senderName, t]);

		const lastMessageAttachmentContent = useMemo(() => {
			const isLinkMessage = contentTextObj?.isLinkMessage;
			const text = contentTextObj?.text;
			if (embed) {
				if (embed?.title || embed?.description) {
					return `${embed?.title || embed?.description}`;
				} else if (embed?.fields?.[0]?.value === 'share_contact') {
					return `[${t('attachments.contact')}]`;
				} else {
					return ``;
				}
			}
			const isGoogleMapsLink = validLinkGoogleMapRegex.test(text);
			if (isGoogleMapsLink) {
				return `[${t('attachments.location')}]`;
			}
			if (isLinkMessage) {
				return `[${t('attachments.link')}] ${text}`;
			}

			const fileName = attachment?.filename;
			const fileType = attachment?.filetype;
			const url = attachment?.url;

			const type = fileType?.split('/')?.[0];

			switch (type) {
				case 'image': {
					if (url?.includes(EMimeTypes.tenor)) {
						return `[${t('attachments.gif')}]`;
					}
					if (url?.includes(EMimeTypes.cdnmezon) || url?.includes(EMimeTypes.cdnmezon2) || url?.includes(EMimeTypes.cdnmezon3)) {
						return `[${t('attachments.sticker')}]`;
					}
					return `[${t('attachments.image')}]`;
				}
				case 'video': {
					return `[${t('attachments.video')}]`;
				}
				case 'audio': {
					return `[${t('attachments.audio')}]`;
				}
				case 'application':
				case 'text':
					return `[${t('attachments.file')}] ${fileName || ''}`;
				default:
					return `[${t('attachments.file')}]`;
			}
		}, [attachment, contentTextObj, embed, t]);

		if (isEmpty(content)) {
			if (isTypeDMGroup) {
				return (
					<View style={styles.contentMessage}>
						<Text
							style={[
								styles.defaultText,
								styles.lastMessage,
								{ color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }
							]}
						>
							{t('directMessage.groupCreated')}
						</Text>
					</View>
				);
			} else {
				return <MemberInvoiceStatus userId={userId} />;
			}
		}

		if (!contentTextObj?.text || contentTextObj?.isLinkMessage) {
			return (
				<View style={styles.contentMessage}>
					<Text
						style={[
							styles.defaultText,
							styles.lastMessage,
							{ color: isUnReadChannel && !isYourAccount ? themeValue.textStrong : themeValue.textDisabled }
						]}
						numberOfLines={1}
					>
						{renderLastMessageContent}
						{lastMessageAttachmentContent}
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.contentMessage}>
				{renderLastMessageContent && (
					<Text
						style={[styles.defaultText, styles.lastMessage, { color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }]}
					>
						{renderLastMessageContent}
					</Text>
				)}
				{!!content && (
					<DmListItemLastMessage
						content={typeof content === 'object' ? content : safeJSONParse(content || '{}')}
						styleText={{ color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }}
					/>
				)}
			</View>
		);
	},
	(prev, next) => prev.lastSentMessageStr === next.lastSentMessageStr && prev.isUnReadChannel === next.isUnReadChannel
);
