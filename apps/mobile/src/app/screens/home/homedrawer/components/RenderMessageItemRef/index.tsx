import { size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import { style } from '../../styles';
import { MessageReferences } from '../MessageReferences';

interface RenderMessageItemRefProps {
	channelId: string;
	message: MessagesEntity;
	preventAction: boolean;
	isSearchTab?: boolean;
	onLongPress?: () => void;
}

export const RenderMessageItemRef = ({ channelId, message, preventAction, isSearchTab, onLongPress }: RenderMessageItemRefProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation('message');
	const styles = style(themeValue);
	const messageReferences = message?.references?.[0];
	const isMessageReplyDeleted = message?.references?.length && !message.references?.[0]?.message_ref_id;

	return (
		<>
			{!!messageReferences && !!messageReferences?.message_ref_id && !isSearchTab && (
				<MessageReferences
					messageReferences={messageReferences}
					preventAction={preventAction}
					isMessageReply={true}
					channelId={channelId ?? message?.channel_id}
					clanId={message.clan_id}
					onLongPress={onLongPress}
				/>
			)}
			{isMessageReplyDeleted && !isSearchTab ? (
				<View style={styles.aboveMessageDeleteReply}>
					<View style={styles.iconReply}>
						<MezonIconCDN
							icon={IconCDN.reply}
							width={size.s_34}
							height={size.s_30}
							color={themeValue.text}
							customStyle={styles.deletedMessageReplyIcon}
						/>
					</View>
					<View style={styles.iconMessageDeleteReply}>
						<MezonIconCDN icon={IconCDN.replyDelete} width={size.s_12} height={size.s_12} />
					</View>
					<Text style={styles.messageDeleteReplyText}>{t('messageDeleteReply')}</Text>
				</View>
			) : null}
		</>
	);
};
