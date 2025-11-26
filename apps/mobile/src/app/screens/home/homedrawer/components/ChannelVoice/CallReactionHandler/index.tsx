import { size, useTheme } from '@mezon/mobile-ui';
import { useMezon } from '@mezon/transport';
import { getSrcEmoji, getSrcSound, UsersClanEntity } from '@mezon/utils';
import type { VoiceReactionSend } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Sound from 'react-native-sound';
import { style } from '../styles';

const { width, height } = Dimensions.get('window');

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
		TOTAL: 4000,
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
	startX: number;
	startY: number;
	displayName?: string;
}

interface ReactProps {
	channelId: string;
	isAnimatedCompleted: boolean;
	onSoundReaction: (senderId: string, soundId: string) => void;
	allUserClans: UsersClanEntity[];
}

// Memoized emoji component for better performance
const AnimatedEmoji = memo(({ item, styles }: { item: EmojiItem; styles: any }) => {
	return (
		<Animated.View
			style={[
				styles.animatedEmojiContainer,
				{
					transform: [{ translateY: item.translateY }, { translateX: item.translateX }, { scale: item.scale }],
					opacity: item.opacity
				}
			]}
		>
			<FastImage source={{ uri: getSrcEmoji(item.emojiId) }} style={styles.emojiImage} resizeMode="contain" />
			{item?.displayName && (
				<View style={styles.reactionSenderEmojiContainer}>
					<Text numberOfLines={1} style={styles.senderName}>
						{item.displayName}
					</Text>
				</View>
			)}
		</Animated.View>
	);
});

AnimatedEmoji.displayName = 'AnimatedEmoji';

export const CallReactionHandler = memo(({ channelId, isAnimatedCompleted, onSoundReaction, allUserClans }: ReactProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [displayedEmojis, setDisplayedEmojis] = useState<EmojiItem[]>([]);
	const { socketRef } = useMezon();
	const animationTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
	const soundRefs = useRef<Map<string, Sound>>(new Map());
	// Cleanup function for timeouts
	const cleanupTimeouts = useCallback(() => {
		animationTimeoutsRef.current.forEach(clearTimeout);
		animationTimeoutsRef.current.clear();
	}, []);
	const displayedCountRef = useRef<number>(0);

	// Optimized emoji removal with cleanup
	const removeEmoji = useCallback((emojiId: string) => {
		setDisplayedEmojis((prev) => prev.filter((item) => item.id !== emojiId));
		displayedCountRef.current = Math.max(0, displayedCountRef.current - 1);
	}, []);

	// Create optimized animation sequence
	const createEmojiAnimation = useCallback((emojiItem: EmojiItem): Animated.CompositeAnimation => {
		const { translateY, translateX, scale, opacity } = emojiItem;
		const horizontalOffset = (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_HORIZONTAL_OFFSET;
		const finalY = -(height * ANIMATION_CONFIG.FLIGHT_HEIGHT_RATIO + Math.random() * height * ANIMATION_CONFIG.FLIGHT_HEIGHT_VARIANCE);
		const bezierControlX = horizontalOffset * (1.5 + Math.random());

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
				Animated.delay(1000),
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
			])
		]);
	}, []);

	// Optimized emoji creation and animation trigger
	const createAndAnimateEmoji = useCallback(
		(emojiId: string, displayName = '') => {
			const horizontalOffset = (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_HORIZONTAL_OFFSET;
			const verticalOffset = Math.random() * ANIMATION_CONFIG.MAX_VERTICAL_OFFSET;

			const newEmoji: EmojiItem = {
				id: `${Date.now()}-${emojiId}-${Math.random()}`, // More unique ID
				emojiId,
				translateY: new Animated.Value(0),
				translateX: new Animated.Value(0),
				scale: new Animated.Value(0),
				opacity: new Animated.Value(0),
				startX: ANIMATION_CONFIG.START_X + horizontalOffset * 0.2,
				startY: ANIMATION_CONFIG.START_Y - verticalOffset,
				displayName
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

	const playSound = useCallback((soundUrl: string, soundId: string) => {
		try {
			if (!soundUrl) {
				console.warn('Invalid sound URL');
				return;
			}
			const currentSound = soundRefs.current.get(soundId);
			if (currentSound) {
				currentSound.pause();
				currentSound.setCurrentTime(0);
				soundRefs?.current?.delete?.(soundId);
			}
			Sound.setCategory('Playback', true);
			const sound = new Sound(soundUrl, null, (error) => {
				if (error) {
					console.error('Failed to load sound reaction:', error);
					return;
				}

				if (Platform.OS === 'ios') {
					sound.setNumberOfLoops(0);
				}
				sound.setVolume(1.0);
				soundRefs.current.set(soundId, sound);

				sound.play((success) => {
					if (!success) {
						console.error('Sound playback failed');
					}
					sound.release();
					soundRefs.current.delete(soundId);
				});
			});
		} catch (error) {
			console.error('Error playing sound reaction:', error);
		}
	}, []);

	// Optimized socket message handler
	const handleVoiceReactionMessage = useCallback(
		(message: VoiceReactionSend) => {
			if (channelId !== message?.channel_id || displayedCountRef?.current >= 10) return;
			try {
				const emojis = message.emojis || [];
				const emojiId = emojis[0];
				const senderId = message.sender_id;

				if (emojiId) {
					if (emojiId.startsWith('sound:')) {
						const soundId = emojiId.replace('sound:', '');
						const soundUrl = getSrcSound(soundId);

						playSound(soundUrl, soundId);
						if (onSoundReaction && senderId) {
							onSoundReaction(senderId, soundId);
						}
					} else {
						const members = allUserClans.find((item) => item.id === senderId);
						const displayName = members?.clan_nick || members?.user?.display_name || members?.user?.username || '';

						createAndAnimateEmoji(emojiId, displayName);
					}
				}
				displayedCountRef.current = displayedCountRef.current + 1;
			} catch (error) {
				console.error('Error handling voice reaction:', error);
				displayedCountRef.current = Math.max(0, displayedCountRef.current - 1);
			}
		},
		[allUserClans, channelId, createAndAnimateEmoji, onSoundReaction, playSound]
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
			if (soundRefs.current && soundRefs.current.size > 0) {
				soundRefs.current.forEach((sound) => {
					sound.pause();
				});
				soundRefs.current?.clear();
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

	if (displayedEmojis?.length === 0 || !isAnimatedCompleted) {
		return null;
	}

	return (
		<View style={styles.reactionContainer}>
			{displayedEmojis.map((item) => (
				<AnimatedEmoji key={item.id} item={item} styles={styles} />
			))}
		</View>
	);
});

CallReactionHandler.displayName = 'CallReactionHandler';
