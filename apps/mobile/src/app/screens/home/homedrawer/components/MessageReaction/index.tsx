import { useTheme } from '@mezon/mobile-ui';
import { selectComputedReactionsByMessageId } from '@mezon/store-mobile';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { IMessageReactionProps } from '../../types';
import { MessageReactionWrapper } from './MessageReactionWrapper';
import { style } from './styles';

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
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	if (!!message?.reactions?.length && !messageReactions)
		return (
			<View style={[styles.reactionWrapper, styles.reactionSpace]}>
				{!!message?.reactions?.length &&
					message?.reactions?.map((i) => {
						return <View style={[styles.imageReactionTemp]} />;
					})}
			</View>
		);

	return <MessageReactionWrapper {...props} messageReactions={messageReactions} />;
});
