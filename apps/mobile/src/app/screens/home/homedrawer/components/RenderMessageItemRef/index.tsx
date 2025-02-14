import { ReplyIcon, ReplyMessageDeleted } from '@mezon/mobile-components';
import { Text, useTheme } from '@mezon/mobile-ui';
import { MessagesEntity } from '@mezon/store';
import { ApiMessageRef } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { style } from '../../styles';
import { MessageReferences } from '../MessageReferences';

interface RenderMessageItemRefProps {
	message: MessagesEntity;
	preventAction: boolean;
	isSearchTab?: boolean;
}

export const RenderMessageItemRef = React.memo(
	({ message, preventAction, isSearchTab }: RenderMessageItemRefProps) => {
		const { themeValue } = useTheme();
		const { t } = useTranslation('message');

		const styles = style(themeValue);

		const messageReferences = useMemo(() => {
			return message?.references?.[0] as ApiMessageRef;
		}, [message?.references]);

		const isMessageReplyDeleted = useMemo(() => {
			return message?.references?.length && !message.references?.[0]?.message_ref_id;
		}, [message?.references]);

		return (
			<>
				{!!messageReferences && !!messageReferences?.message_ref_id && !isSearchTab && (
					<MessageReferences
						messageReferences={messageReferences}
						preventAction={preventAction}
						isMessageReply={true}
						channelId={message.channel_id}
						clanId={message.clan_id}
					/>
				)}
				{isMessageReplyDeleted && !isSearchTab ? (
					<View style={styles.aboveMessageDeleteReply}>
						<View style={styles.iconReply}>
							<ReplyIcon width={34} height={30} style={styles.deletedMessageReplyIcon} />
						</View>
						<View style={styles.iconMessageDeleteReply}>
							<ReplyMessageDeleted width={18} height={9} />
						</View>
						<Text style={styles.messageDeleteReplyText}>{t('messageDeleteReply')}</Text>
					</View>
				) : null}
			</>
		);
	},
	(prevProps, nextProps) => {
		return prevProps?.message?.id + prevProps?.message?.update_time === nextProps?.message?.id + nextProps?.message?.update_time;
	}
);
