import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { style } from '../styles';

const { width, height } = Dimensions.get('window');

enum ReactionType {
	NONE = 0,
	VIDEO = 1
}

type reactProps = {
	channel: ChannelsEntity;
	isAnimatedCompleted: boolean;
};

export const CallReactionHandler = memo(({ channel, isAnimatedCompleted }: reactProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const [displayedEmojis, setDisplayedEmojis] = useState<any[]>([]);

	const { socketRef } = useMezon();
	const lastPositionRef = useRef<number>(Math.floor(Math.random() * 40));

	const generatePosition = useCallback(() => {
		const newPosition = (lastPositionRef.current + 10 + Math.floor(Math.random() * 20)) % 40;
		lastPositionRef.current = newPosition;

		const bottomOffset = 35 + Math.floor(Math.random() * 10);
		const duration = 2.5 + Math.random() * 1;

		return {
			left: `${30 + newPosition}%`,
			bottom: `${bottomOffset}%`,
			duration: `${duration.toFixed(1)}s`
		};
	}, []);

	useEffect(() => {
		if (!socketRef.current) return;

		const currentSocket = socketRef.current;
		const originalOnChannelMessage = currentSocket.onchannelmessage;

		currentSocket.onchannelmessage = (message: any) => {
			if (originalOnChannelMessage) {
				originalOnChannelMessage(message);
			}

			if (channel?.channel_id === message.channel_id) {
				try {
					const content = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;

					if (content.vr !== ReactionType.VIDEO) return;

					if (content.ej && content.ej.length > 0) {
						const emojiData = content.ej[0];

						const id = message?.message_id || Date.now().toString();
						const startX = Math.random() * (width - size.s_100 * 2);
						const translateY = new Animated.Value(0);
						const opacity = new Animated.Value(1);
						const duration = 4500 + Math.random() * 1000;

						const newEmoji = {
							id: id.toString(),
							emoji: content?.t?.trim(),
							emojiId: emojiData.emojiid,
							startX,
							translateY,
							opacity
						};

						setDisplayedEmojis((prev) => [...prev, newEmoji]);

						Animated.parallel([
							Animated.timing(translateY, {
								toValue: -height * 0.6,
								duration,
								easing: Easing.out(Easing.quad),
								useNativeDriver: true
							}),
							Animated.timing(opacity, {
								toValue: 0,
								duration,
								easing: Easing.linear,
								useNativeDriver: true
							})
						]).start(() => {
							setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
						});
					}
				} catch (error) {
					console.error(error);
				}
			}
		};

		return () => {
			if (currentSocket) {
				currentSocket.onchannelmessage = originalOnChannelMessage;
			}
		};
	}, [socketRef, channel, generatePosition]);

	if (displayedEmojis.length === 0 || !isAnimatedCompleted) {
		return null;
	}

	return (
		<View style={styles.reactionContainer}>
			{displayedEmojis.map((item) => (
				<Animated.View
					key={item.id}
					style={{
						position: 'absolute',
						bottom: 0,
						left: item.startX,
						transform: [{ translateY: item.translateY }],
						opacity: item.opacity,
						alignItems: 'center'
					}}
				>
					<FastImage source={{ uri: getSrcEmoji(item.emojiId) }} style={styles.animatedEmoji} />
				</Animated.View>
			))}
		</View>
	);
});
