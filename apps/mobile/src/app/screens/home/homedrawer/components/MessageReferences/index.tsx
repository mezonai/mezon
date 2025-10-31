import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelMembersEntity } from '@mezon/store-mobile';
import { getStore, messagesActions, selectMemberClanByUserId, useAppDispatch } from '@mezon/store-mobile';
import { safeJSONParse } from 'mezon-js';
import type { ApiMessageRef } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { DmListItemLastMessage } from '../../../../messages/DMListItemLastMessage';
import { style } from './styles';

interface IProps {
	messageReferences?: ApiMessageRef;
	preventAction: boolean;
	isMessageReply?: boolean;
	channelId?: string;
	clanId?: string;
	onLongPress?: () => void;
}

export const MessageReferences = ({ messageReferences, preventAction, channelId, clanId, onLongPress }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { t } = useTranslation('message');
	const avatarSender = useMemo(() => {
		if (messageReferences?.mesages_sender_avatar) {
			return messageReferences?.mesages_sender_avatar;
		}
		const store = getStore();
		const state = store.getState();
		const messageSender = selectMemberClanByUserId(state, messageReferences?.message_sender_id ?? '') as unknown as ChannelMembersEntity;
		return messageSender?.clan_avatar || messageSender?.user?.avatar_url || '';
	}, [messageReferences]);
	const isEmbedMessage = useMemo(() => {
		try {
			const content = safeJSONParse(messageReferences?.content ?? '{}');
			return !content?.t && content?.embed;
		} catch (error) {
			console.error('Failed to parse message references content: ', error);
			return false;
		}
	}, [messageReferences?.content]);

	const handleJumpToMessage = (messageId: string) => {
		requestAnimationFrame(async () => {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: clanId || '',
					messageId,
					channelId
				})
			);
		});
	};

	const onPressAvatar = () => {
		if (!preventAction) {
			handleJumpToMessage(messageReferences?.message_ref_id);
		}
	};

	return (
		<Pressable onLongPress={preventAction ? undefined : onLongPress} onPress={onPressAvatar} style={styles.aboveMessage}>
			<View style={styles.iconReply}>
				<MezonIconCDN icon={IconCDN.reply} width={size.s_34} height={size.s_30} useOriginalColor={true} />
			</View>
			<View style={styles.repliedMessageWrapper}>
				<MezonAvatar
					avatarUrl={avatarSender}
					username={messageReferences?.message_sender_username}
					height={size.s_20}
					width={size.s_20}
					isMsgReply={true}
				/>
				<View style={styles.replyContentWrapper}>
					<Text style={styles.replyDisplayName}>
						{messageReferences?.message_sender_clan_nick ||
							messageReferences?.message_sender_display_name ||
							messageReferences?.message_sender_username ||
							'Anonymous'}
						<FastImage />
					</Text>
					{messageReferences?.has_attachment || isEmbedMessage ? (
						<View style={styles.attachmentIconWrapper}>
							<Text style={styles.tapToSeeAttachmentText}>{t('tapToSeeAttachment')} </Text>
							<MezonIconCDN icon={IconCDN.imageIcon} width={size.s_12} height={size.s_12} color={themeValue.text} />
						</View>
					) : (
						<DmListItemLastMessage content={safeJSONParse(messageReferences?.content || '{}')} styleText={styles.dmMessageStyleText} />
					)}
				</View>
			</View>
		</Pressable>
	);
};
