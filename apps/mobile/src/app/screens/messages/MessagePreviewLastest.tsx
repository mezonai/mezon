import { isEmpty, load, STORAGE_MY_USER_ID, validLinkGoogleMapRegex } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { isContainsUrl } from '@mezon/transport';
import { SHARE_CONTACT_KEY } from '@mezon/utils';
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

		const renderLastMessageAuthor = useMemo(() => {
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

		const renderLastMessageContent = useMemo(() => {
			if (embed) {
				if (embed?.title || embed?.description) {
					return `${embed?.title || embed?.description}`;
				} else if (embed?.fields?.[0]?.value === SHARE_CONTACT_KEY) {
					return `[${t('attachments.contact')}]`;
				} else {
					return ``;
				}
			}
			const isGoogleMapsLink = validLinkGoogleMapRegex.test(contentTextObj?.text);
			if (isGoogleMapsLink) {
				return `[${t('attachments.location')}]`;
			}
			if (contentTextObj?.isLinkMessage) {
				return `[${t('attachments.link')}] ${contentTextObj?.text}`;
			}

			return `[${t('attachments.file')}]`;
		}, [contentTextObj, embed, t]);

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
						{renderLastMessageAuthor}
						{renderLastMessageContent}
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.contentMessage}>
				{renderLastMessageAuthor && (
					<Text
						style={[styles.defaultText, styles.lastMessage, { color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }]}
					>
						{renderLastMessageAuthor}
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
