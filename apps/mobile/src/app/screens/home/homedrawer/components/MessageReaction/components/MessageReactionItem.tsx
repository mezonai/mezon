import { ActionEmitEvent } from '@mezon/mobile-components';
import { size } from '@mezon/mobile-ui';
import type { EmojiDataOptionals, SenderInfoOptionals } from '@mezon/utils';
import { calculateTotalCount, getSrcEmoji } from '@mezon/utils';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Pressable, Text, View } from 'react-native';
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
		const isMyReaction = emojiItemData?.senders?.find?.((sender: SenderInfoOptionals) => sender.senderId === userId);
		const countReacts = calculateTotalCount(emojiItemData.senders);

		const [flyingEmojis, setFlyingEmojis] = useState<
			Array<{ id: number; translateY: Animated.Value; translateX: Animated.Value; scale: Animated.Value; opacity: Animated.Value }>
		>([]);
		const emojiIdCounter = useRef(0);

		const handlePress = useCallback(() => {
			if (preventAction) return;
			const emojiId = emojiIdCounter.current++;
			const translateY = new Animated.Value(0);
			const translateX = new Animated.Value(0);
			const scale = new Animated.Value(1);
			const opacity = new Animated.Value(1);

			const randomX1 = Math.random() * 60 - 30;
			const randomX2 = Math.random() * 40 - 20;
			const randomY = -(180 + Math.random() * 60);

			setFlyingEmojis((prev) => [...prev, { id: emojiId, translateY, translateX, scale, opacity }]);
			Animated.parallel([
				Animated.timing(translateY, {
					toValue: randomY,
					duration: 1200,
					useNativeDriver: true
				}),
				Animated.sequence([
					Animated.timing(translateX, {
						toValue: randomX1,
						duration: 600,
						useNativeDriver: true
					}),
					Animated.timing(translateX, {
						toValue: randomX2,
						duration: 600,
						useNativeDriver: true
					})
				]),
				Animated.sequence([
					Animated.timing(scale, {
						toValue: 1.3,
						duration: 400,
						useNativeDriver: true
					}),
					Animated.timing(scale, {
						toValue: 0.6,
						duration: 800,
						useNativeDriver: true
					})
				]),
				Animated.timing(opacity, {
					toValue: 0,
					duration: 1200,
					useNativeDriver: true
				})
			]).start(() => {
				setFlyingEmojis((prev) => prev.filter((emoji) => emoji.id !== emojiId));
			});

			DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
				id: emojiItemData.id ?? '',
				mode,
				messageId: message?.id ?? '',
				channelId: message?.channelId ?? '',
				emojiId: emojiItemData?.emojiId ?? '',
				emoji: emojiItemData.emoji ?? '',
				senderId: message?.senderId ?? '',
				countToRemove: 1,
				actionDelete: false,
				topicId: topicId || ''
			} as IReactionMessageProps);
		}, [emojiItemData, preventAction, message, mode, topicId]);

		const handleLongPress = useCallback(() => {
			if (!preventAction) onReactItemLongPress(emojiItemData.emojiId);
		}, [emojiItemData.emojiId, preventAction, onReactItemLongPress]);

		return (
			<View>
				<Pressable
					delayLongPress={200}
					onLongPress={handleLongPress}
					onPress={handlePress}
					style={[styles.reactItem, isMyReaction ? styles.myReaction : styles.otherReaction]}
				>
					<FastImage source={{ uri: getSrcEmoji(emojiItemData.emojiId ?? '') }} style={styles.iconEmojiReaction} resizeMode="contain" />
					<Text style={styles.reactCount}>{countReacts}</Text>
				</Pressable>
				{flyingEmojis.map((flyingEmoji) => (
					<Animated.View
						key={flyingEmoji.id}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: size.s_40,
							height: size.s_40,
							alignItems: 'center',
							justifyContent: 'center',
							transform: [{ translateY: flyingEmoji.translateY }, { translateX: flyingEmoji.translateX }, { scale: flyingEmoji.scale }],
							opacity: flyingEmoji.opacity,
							pointerEvents: 'none'
						}}
					>
						<FastImage
							source={{ uri: getSrcEmoji(emojiItemData.emojiId ?? '') }}
							style={{ width: size.s_24, height: size.s_24 }}
							resizeMode="contain"
						/>
					</Animated.View>
				))}
			</View>
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
