import { useChatSending } from '@mezon/core';
import { AppStorage, load, STORAGE_USERS_QUICK_REACTION } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectCurrentUserId, selectDmGroupCurrent, useAppSelector } from '@mezon/store-mobile';
import { getSrcEmoji } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { style } from './styles';

interface QuickReactionButtonProps {
	channelId: string;
	mode: ChannelStreamMode;
	isShowJumpToPresent: boolean;
	windowWidth: number;
	windowHeight: number;
}

interface QuickReactionEmoji {
	emojiId: string;
	shortname: string;
}

const QuickReactionButton = ({ channelId, mode, isShowJumpToPresent, windowWidth, windowHeight }: QuickReactionButtonProps) => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const currentUserId = useAppSelector(selectCurrentUserId);
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));
	const currentDmGroup = useAppSelector(selectDmGroupCurrent(channelId));
	const [quickReactionEmoji, setQuickReactionEmoji] = useState<QuickReactionEmoji | null>(null);
	const [hasCustomPosition, setHasCustomPosition] = useState<boolean>(false);

	const computedEntitySize = useMemo(() => {
		return {
			button: isTabletLandscape ? size.s_40 : size.s_32,
			marginLeft: isTabletLandscape ? size.s_8 : size.s_6
		};
	}, [isTabletLandscape]);

	const styles = useMemo(() => style(themeValue, computedEntitySize), [themeValue, computedEntitySize]);

	const computedChannelId = useMemo(() => {
		return (mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel?.parent_id : channelId) ?? '';
	}, [channelId, currentChannel?.parent_id, mode]);

	useEffect(() => {
		if (!currentUserId || !computedChannelId) return;
		const data = load(STORAGE_USERS_QUICK_REACTION);
		setQuickReactionEmoji(data?.[currentUserId]?.[computedChannelId] ?? null);

		const listener = AppStorage.addOnValueChangedListener((key) => {
			if (key === STORAGE_USERS_QUICK_REACTION) {
				const updatedData = load(STORAGE_USERS_QUICK_REACTION);
				setQuickReactionEmoji(updatedData?.[currentUserId]?.[computedChannelId] ?? null);
			}
		});

		return () => {
			listener?.remove();
		};
	}, [currentUserId, computedChannelId]);

	const initialBounds = useMemo(() => {
		return {
			MAX_X: windowWidth - computedEntitySize.button - size.s_10,
			MIN_Y: -windowHeight,
			DEFAULT_X: windowWidth - computedEntitySize.button - size.s_20,
			DEFAULT_Y: isShowJumpToPresent ? -size.s_90 : -size.s_28
		};
	}, [windowWidth, computedEntitySize.button, isShowJumpToPresent, windowHeight]);

	const translateX = useSharedValue(initialBounds.DEFAULT_X);
	const translateY = useSharedValue(initialBounds.DEFAULT_Y);
	const scale = useSharedValue(1);
	const hasMoved = useSharedValue(false);

	useEffect(() => {
		if (Math.abs(translateY.value) > Math.abs(initialBounds.MIN_Y)) {
			translateY.value = withSpring(initialBounds.MIN_Y);
		}
	}, [initialBounds.MIN_Y]);

	useEffect(() => {
		if (isTabletLandscape) {
			setHasCustomPosition(false);
			translateX.value = initialBounds.DEFAULT_X;
			translateY.value = initialBounds.DEFAULT_Y;
		}
	}, [computedChannelId, isTabletLandscape]);

	useEffect(() => {
		if (!hasCustomPosition) {
			translateX.value = initialBounds.DEFAULT_X;
			translateY.value = withSpring(initialBounds.DEFAULT_Y);
		}
	}, [hasCustomPosition, initialBounds.DEFAULT_Y, initialBounds.DEFAULT_X]);

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', () => {
			setHasCustomPosition(false);
		});

		return () => {
			subscription?.remove();
		};
	}, []);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP ? currentDmGroup : currentChannel,
		fromTopic: false
	});

	const handleSend = useCallback(() => {
		if (!quickReactionEmoji?.emojiId || !quickReactionEmoji?.shortname) return;
		sendMessage(
			{
				t: `${quickReactionEmoji.shortname}`,
				ej: [{ emojiid: quickReactionEmoji.emojiId, s: 0, e: quickReactionEmoji.shortname.length }]
			},
			[],
			[],
			[]
		);
	}, [quickReactionEmoji, sendMessage]);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(10)
				.onBegin(() => {
					hasMoved.value = false;
					scale.value = withSpring(1.1);
				})
				.onChange(({ changeX, changeY }) => {
					if (Math.abs(changeX) > 0 || Math.abs(changeY) > 0) {
						hasMoved.value = true;
					}
					translateX.value = clamp(translateX.value + changeX, 0, initialBounds.MAX_X);
					translateY.value = clamp(translateY.value + changeY, initialBounds.MIN_Y, 0);
				})
				.onFinalize(() => {
					if (hasMoved.value) {
						runOnJS(setHasCustomPosition)(true);
					}
					scale.value = withSpring(1);
				}),
		[initialBounds.MAX_X, initialBounds.MIN_Y]
	);

	const tapGesture = useMemo(
		() =>
			Gesture.Tap()
				.maxDuration(200)
				.onStart(() => {
					scale.value = withSpring(0.9);
				})
				.onEnd(() => {
					scale.value = withSpring(1);
					runOnJS(handleSend)();
				}),
		[handleSend]
	);

	const gesture = useMemo(() => Gesture.Exclusive(panGesture, tapGesture), [panGesture, tapGesture]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }] as const
	}));

	if (!quickReactionEmoji?.emojiId || !windowWidth || !windowHeight) return null;

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View style={[styles.quickReactionContainer, animatedStyle]}>
				<FastImage source={{ uri: getSrcEmoji(quickReactionEmoji.emojiId) }} style={styles.quickReactionEmoji} resizeMode="contain" />
			</Animated.View>
		</GestureDetector>
	);
};

export default memo(QuickReactionButton);
