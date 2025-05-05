import { useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { selectMessageByMessageId } from '@mezon/store-mobile';
import React from 'react';
import { View } from 'react-native';
import { combineMessageReactions } from '../../../../../utils/helpers';
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
	const messageReactions = useAppSelector((state) => selectMessageByMessageId(state, message.channel_id, message.id));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const combineReactions = combineMessageReactions(messageReactions?.reactions, message?.id);

	if (combineReactions?.length === 0) {
		return null;
	}

	if (!!message?.reactions?.length && !messageReactions)
		return (
			<View style={[styles.reactionWrapper, styles.reactionSpace]}>
				{!!message?.reactions?.length &&
					message?.reactions?.map((i) => {
						return <View style={[styles.imageReactionTemp]} />;
					})}
			</View>
		);

	return <MessageReactionWrapper {...props} messageReactions={combineReactions} />;
});
