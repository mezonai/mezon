import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import { VoiceReactionSend } from 'mezon-js';
import { memo, useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { style } from '../styles';

const { width, height } = Dimensions.get('window');

type reactProps = {
	channel: ChannelsEntity;
	isAnimatedCompleted: boolean;
};

export const CallReactionHandler = memo(({ channel, isAnimatedCompleted }: reactProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [displayedEmojis, setDisplayedEmojis] = useState<any[]>([]);
	const { socketRef } = useMezon();

	useEffect(() => {
		if (!socketRef.current) return;

		const currentSocket = socketRef.current;
		currentSocket.onvoicereactionmessage = (message: VoiceReactionSend) => {
			if (channel?.channel_id === message?.channel_id) {
				try {
					const emojis = message.emojis || [];
					emojis.forEach((emojiId) => {
						if (emojiId) {
							Array.from({ length: 10 }).forEach((_, index) => {
								const startX = Math.random() * (width - size.s_100 * 2);
								const baseTranslateY = new Animated.Value(0);
								const translateX = new Animated.Value(0);
								const scale = new Animated.Value(1);
								const opacity = new Animated.Value(0);
								const rotation = new Animated.Value(0);
								const finalRotation = Math.random() * 30 - 15;
								const randomZoom = 1 + Math.random();

								const newEmoji = {
									id: `${Date.now()}-${emojiId}-${index}`,
									emojiId,
									startX,
									baseTranslateY,
									translateX,
									scale,
									opacity,
									rotation
								};

								setDisplayedEmojis((prev) => [...prev, newEmoji]);

								Animated.sequence([
									Animated.delay(index * 300),
									Animated.parallel([
										Animated.sequence([
											Animated.timing(opacity, {
												toValue: 1,
												duration: 500,
												useNativeDriver: true
											}),
											Animated.timing(opacity, {
												toValue: 0,
												duration: 1500,
												useNativeDriver: true
											})
										]),
										Animated.timing(baseTranslateY, {
											toValue: -height * 0.6,
											duration: 2000,
											useNativeDriver: true
										}),
										Animated.timing(translateX, {
											toValue: Math.random() * 50 - 25,
											duration: 2000,
											useNativeDriver: true
										}),
										Animated.timing(scale, {
											toValue: randomZoom,
											duration: 2000,
											easing: Easing.out(Easing.quad),
											useNativeDriver: true
										}),
										Animated.timing(rotation, {
											toValue: finalRotation,
											duration: 2000,
											easing: Easing.linear,
											useNativeDriver: true
										})
									])
								]).start(() => {
									setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
								});
							});
						}
					});
				} catch (error) {
					console.error(error);
				}
			}
		};

		return () => {
			if (currentSocket) {
				currentSocket.onvoicereactionmessage = () => {};
			}
		};
	}, [channel?.channel_id, socketRef]);

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
						transform: [
							{ translateY: item.baseTranslateY },
							{ translateX: item.translateX },
							{ scale: item.scale },
							{
								rotate: item.rotation.interpolate({
									inputRange: [-15, 15],
									outputRange: ['-15deg', '15deg']
								})
							}
						],
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
