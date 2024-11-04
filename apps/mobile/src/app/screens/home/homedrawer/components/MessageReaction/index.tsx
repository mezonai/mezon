import { selectComputedReactionsByMessageId } from '@mezon/store-mobile';
import React from 'react';
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
};

export const MessageAction = React.memo((props: IMessageReactionProps) => {
	const { message } = props || {};
	const messageReactions = useSelector(selectComputedReactionsByMessageId(message.channel_id, message.id));

	return <MessageReactionWrapper {...props} messageReactions={messageReactions} />;
});
