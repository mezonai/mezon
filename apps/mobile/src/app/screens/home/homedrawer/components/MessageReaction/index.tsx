import { useIdleRender } from '@mezon/core';
import { size } from '@mezon/mobile-ui';
import { selectComputedReactionsByMessageId } from '@mezon/store-mobile';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { IMessageReactionProps } from '../../types';
import { MessageReactionWrapper } from './MessageReactionWrapper';

export type IReactionMessageProps = {
	id: string;
	mode: number;
	clanId?: string;
	messageId: string;
	channelId: string;
	emojiId: string;
	emoji: string;
	countToRemove?: number;
	senderId: string;
	actionDelete?: boolean;
	topicId?: string;
	userId?: string;
};

export const MessageAction = React.memo((props: IMessageReactionProps) => {
	const { message } = props || {};
	const messageReactions = useSelector(selectComputedReactionsByMessageId(message.channel_id, message.id));
	const shouldRender = useIdleRender();
	if (!shouldRender)
		return (
			<View style={{ paddingTop: size.s_6, flexDirection: 'row', gap: size.s_6, flexWrap: 'wrap', alignItems: 'center' }}>
				<View
					style={{ flexDirection: 'row', alignItems: 'center', gap: size.s_2, padding: size.s_2, borderRadius: 5, height: size.s_30 }}
				></View>
			</View>
		);

	return <MessageReactionWrapper {...props} messageReactions={messageReactions} />;
});
