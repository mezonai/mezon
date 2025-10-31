import { ActionEmitEvent } from '@mezon/mobile-components';
import type { EmojiDataOptionals, SenderInfoOptionals } from '@mezon/utils';
import { calculateTotalCount, getSrcEmoji } from '@mezon/utils';
import React, { useCallback } from 'react';
import { DeviceEventEmitter, Pressable, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import type { IReactionMessageProps } from '../index';

export type IReactionItem = {
	emojiItemData: EmojiDataOptionals;
	userId: string;
	preventAction: boolean;
	onReactItemLongPress: (emojiId: string) => void;
	message: any;
	mode: number;
	styles: any;
	topicId: string;
};
export const ReactionItem = React.memo(
	({ emojiItemData, userId, preventAction, onReactItemLongPress, message, mode, styles, topicId = '' }: IReactionItem) => {
		const isMyReaction = emojiItemData?.senders?.find?.((sender: SenderInfoOptionals) => sender.sender_id === userId);
		const countReacts = calculateTotalCount(emojiItemData.senders);

		const handlePress = useCallback(() => {
			if (preventAction) return;
			DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
				id: emojiItemData.id ?? '',
				mode,
				messageId: message?.id ?? '',
				channelId: message?.channel_id ?? '',
				emojiId: emojiItemData?.emojiId ?? '',
				emoji: emojiItemData.emoji ?? '',
				senderId: message?.sender_id ?? '',
				countToRemove: 1,
				actionDelete: false,
				topicId: topicId || ''
			} as IReactionMessageProps);
		}, [emojiItemData, preventAction, message, mode, topicId]);

		const handleLongPress = useCallback(() => {
			if (!preventAction) onReactItemLongPress(emojiItemData.emojiId);
		}, [emojiItemData.emojiId, preventAction, onReactItemLongPress]);

		return (
			<Pressable
				delayLongPress={200}
				onLongPress={handleLongPress}
				onPress={handlePress}
				style={[styles.reactItem, isMyReaction ? styles.myReaction : styles.otherReaction]}
			>
				<FastImage source={{ uri: getSrcEmoji(emojiItemData.emojiId ?? '') }} style={styles.iconEmojiReaction} resizeMode="contain" />
				<Text style={styles.reactCount}>{countReacts}</Text>
			</Pressable>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.emojiItemData.id === nextProps.emojiItemData.id &&
			calculateTotalCount(prevProps.emojiItemData.senders) === calculateTotalCount(nextProps.emojiItemData.senders) &&
			prevProps.userId === nextProps.userId &&
			prevProps.preventAction === nextProps.preventAction
		);
	}
);
