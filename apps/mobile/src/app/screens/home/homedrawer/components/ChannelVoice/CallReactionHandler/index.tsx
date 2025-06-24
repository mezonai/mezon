import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import { VoiceReactionSend } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { style } from '../styles';

const { width, height } = Dimensions.get('window');

// Constants for better performance and maintainability
const ANIMATION_CONFIG = {
	EMOJI_SIZE: size.s_36,
	START_X: width / 2,
	START_Y: height - 120,
	MAX_HORIZONTAL_OFFSET: 150,
	MAX_VERTICAL_OFFSET: 30,
	FLIGHT_HEIGHT_RATIO: 0.7,
	FLIGHT_HEIGHT_VARIANCE: 0.2,
	MAX_ROTATION: 120,
	DURATIONS: {
		TOTAL: 4000, // Reduced from 6000 for better UX
		SCALE_BOUNCE: 300,
		SCALE_GROW: 500,
		FADE_IN: 200,
		FADE_OUT: 800,
		HORIZONTAL_PHASES: [800, 1000, 1200]
	},
	Z_INDEX: 1000
} as const;

interface EmojiItem {
	id: string;
	emojiId: string;
	translateY: Animated.Value;
	translateX: Animated.Value;
	scale: Animated.Value;
	opacity: Animated.Value;
	rotation: Animated.Value;
	startX: number;
	startY: number;
}

interface ReactProps {
	channel: ChannelsEntity;
	isAnimatedCompleted: boolean;
}

// Memoized emoji component for better performance
const AnimatedEmoji = memo(({ item }: { item: EmojiItem }) => {
	return (
		<Animated.View
			style={{
				position: 'absolute',
				bottom: 0,
				left: '50%',
				width: ANIMATION_CONFIG.EMOJI_SIZE,
				height: ANIMATION_CONFIG.EMOJI_SIZE,
				transform: [
					{ translateY: item.translateY },
					{ translateX: item.translateX },
					{ scale: item.scale },
					{
						rotate: item.rotation.interpolate({
							inputRange: [-ANIMATION_CONFIG.MAX_ROTATION, ANIMATION_CONFIG.MAX_ROTATION],
							outputRange: ['-120deg', '120deg']
						})
					}
				],
				opacity: item.opacity,
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: ANIMATION_CONFIG.Z_INDEX
			}}
		>
			<FastImage
				source={{ uri: getSrcEmoji(item.emojiId) }}
				style={{
					width: ANIMATION_CONFIG.EMOJI_SIZE,
					height: ANIMATION_CONFIG.EMOJI_SIZE
				}}
				resizeMode="contain"
			/>
		</Animated.View>
	);
});

AnimatedEmoji.displayName = 'AnimatedEmoji';

export const CallReactionHandler = memo(({ channel, isAnimatedCompleted }: ReactProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [displayedEmojis, setDisplayedEmojis] = useState<EmojiItem[]>([]);
	const { socketRef } = useMezon();
	const animationTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

	// Cleanup function for timeouts
	const cleanupTimeouts = useCallback(() => {
		animationTimeoutsRef.current.forEach(clearTimeout);
		animationTimeoutsRef.current.clear();
	}, []);

	// Optimized emoji removal with cleanup
	const removeEmoji = useCallback((emojiId: string) => {
		setDisplayedEmojis((prev) => prev.filter((item) => item.id !== emojiId));
	}, []);

	// Create optimized animation sequence
	const createEmojiAnimation = useCallback((emojiItem: EmojiItem): Animated.CompositeAnimation => {
		const { translateY, translateX, scale, opacity, rotation } = emojiItem;

		// Calculate animation values
		const horizontalOffset = (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_HORIZONTAL_OFFSET;
		const finalY = -(height * ANIMATION_CONFIG.FLIGHT_HEIGHT_RATIO + Math.random() * height * ANIMATION_CONFIG.FLIGHT_HEIGHT_VARIANCE);
		const bezierControlX = horizontalOffset * (1.5 + Math.random());
		const rotationAmount = (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_ROTATION;

		return Animated.parallel([
			// Bounce entrance with optimized scaling
			Animated.sequence([
				Animated.spring(scale, {
					toValue: 1,
					tension: 180,
					friction: 8,
					useNativeDriver: true
				}),
				Animated.timing(scale, {
					toValue: 1.3,
					duration: ANIMATION_CONFIG.DURATIONS.SCALE_GROW,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true
				})
			]),

			// Optimized opacity animation
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 1,
					duration: ANIMATION_CONFIG.DURATIONS.FADE_IN,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true
				}),
				Animated.delay(ANIMATION_CONFIG.DURATIONS.TOTAL - ANIMATION_CONFIG.DURATIONS.FADE_OUT),
				Animated.timing(opacity, {
					toValue: 0,
					duration: ANIMATION_CONFIG.DURATIONS.FADE_OUT,
					easing: Easing.in(Easing.quad),
					useNativeDriver: true
				})
			]),

			// Smooth upward motion
			Animated.timing(translateY, {
				toValue: finalY,
				duration: ANIMATION_CONFIG.DURATIONS.TOTAL,
				easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
				useNativeDriver: true
			}),

			// Optimized curved horizontal motion
			Animated.sequence([
				Animated.timing(translateX, {
					toValue: bezierControlX * 0.3,
					duration: ANIMATION_CONFIG.DURATIONS.HORIZONTAL_PHASES[0],
					easing: Easing.out(Easing.circle),
					useNativeDriver: true
				}),
				Animated.timing(translateX, {
					toValue: bezierControlX * 0.7,
					duration: ANIMATION_CONFIG.DURATIONS.HORIZONTAL_PHASES[1],
					easing: Easing.inOut(Easing.sin),
					useNativeDriver: true
				}),
				Animated.timing(translateX, {
					toValue: horizontalOffset,
					duration: ANIMATION_CONFIG.DURATIONS.HORIZONTAL_PHASES[2],
					easing: Easing.in(Easing.circle),
					useNativeDriver: true
				})
			]),

			// Smooth rotation
			Animated.timing(rotation, {
				toValue: rotationAmount,
				duration: ANIMATION_CONFIG.DURATIONS.TOTAL,
				easing: Easing.inOut(Easing.circle),
				useNativeDriver: true
			})
		]);
	}, []);

	// Optimized emoji creation and animation trigger
	const createAndAnimateEmoji = useCallback(
		(emojiId: string) => {
			const horizontalOffset = (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_HORIZONTAL_OFFSET;
			const verticalOffset = Math.random() * ANIMATION_CONFIG.MAX_VERTICAL_OFFSET;

			const newEmoji: EmojiItem = {
				id: `${Date.now()}-${emojiId}-${Math.random()}`, // More unique ID
				emojiId,
				translateY: new Animated.Value(0),
				translateX: new Animated.Value(0),
				scale: new Animated.Value(0),
				opacity: new Animated.Value(0),
				rotation: new Animated.Value(0),
				startX: ANIMATION_CONFIG.START_X + horizontalOffset * 0.2,
				startY: ANIMATION_CONFIG.START_Y - verticalOffset
			};

			setDisplayedEmojis((prev) => [...prev, newEmoji]);

			const animation = createEmojiAnimation(newEmoji);

			animation.start(() => {
				removeEmoji(newEmoji.id);
			});

			// Set cleanup timeout as fallback
			const timeoutId = setTimeout(() => {
				removeEmoji(newEmoji.id);
				animationTimeoutsRef.current.delete(timeoutId);
			}, ANIMATION_CONFIG.DURATIONS.TOTAL + 500);

			animationTimeoutsRef.current.add(timeoutId);
		},
		[createEmojiAnimation, removeEmoji]
	);

	// Optimized socket message handler
	const handleVoiceReactionMessage = useCallback(
		(message: VoiceReactionSend) => {
			if (channel?.channel_id !== message?.channel_id) return;

			try {
				const emojis = message.emojis || [];
				const emojiId = emojis[0];

				if (emojiId) {
					createAndAnimateEmoji(emojiId);
				}
			} catch (error) {
				console.error('Error handling voice reaction:', error);
			}
		},
		[channel?.channel_id, createAndAnimateEmoji]
	);

	// Effect for socket handling with proper cleanup
	useEffect(() => {
		const currentSocket = socketRef.current;
		if (!currentSocket) return;

		currentSocket.onvoicereactionmessage = handleVoiceReactionMessage;

		return () => {
			if (currentSocket) {
				currentSocket.onvoicereactionmessage = () => {};
			}
			cleanupTimeouts();
		};
	}, [handleVoiceReactionMessage, socketRef, cleanupTimeouts]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			cleanupTimeouts();
		};
	}, [cleanupTimeouts]);

	if (displayedEmojis.length === 0 || !isAnimatedCompleted) {
		return null;
	}

	return <View style={styles.reactionContainer}>{displayedEmojis?.map((item) => <AnimatedEmoji key={item.id} item={item} />)}</View>;
});

CallReactionHandler.displayName = 'CallReactionHandler';
