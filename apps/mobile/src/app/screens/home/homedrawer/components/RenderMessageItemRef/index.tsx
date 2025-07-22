import { useTheme } from '@mezon/mobile-ui';
import { MessagesEntity } from '@mezon/store-mobile';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import { style } from '../../styles';
import { MessageReferences } from '../MessageReferences';

interface RenderMessageItemRefProps {
	message: MessagesEntity;
	preventAction: boolean;
	isSearchTab?: boolean;
	onLongPress?: () => void;
}

export const RenderMessageItemRef = ({ message, preventAction, isSearchTab, onLongPress }: RenderMessageItemRefProps) => {
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
					channelId={message.channel_id}
					clanId={message.clan_id}
					onLongPress={onLongPress}
				/>
			)}
			{isMessageReplyDeleted && !isSearchTab ? (
				<View style={styles.aboveMessageDeleteReply}>
					<View style={styles.iconReply}>
						<MezonIconCDN icon={IconCDN.reply} width={34} height={30} customStyle={styles.deletedMessageReplyIcon} />
					</View>
					<View style={styles.iconMessageDeleteReply}>
						<MezonIconCDN icon={IconCDN.replyDelete} width={12} height={12} />
					</View>
					<Text style={styles.messageDeleteReplyText}>{t('messageDeleteReply')}</Text>
				</View>
			) : null}
		</>
	);
};
