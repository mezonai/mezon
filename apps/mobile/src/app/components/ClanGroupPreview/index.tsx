import React, { memo, useEffect, useMemo } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { ClanGroup } from '../ClanGroup';
import { style } from './styles';

interface GroupPreviewProps {
	targetItem: any;
	dragItem: any;
	clans: any[];
}

const CLAN = 'clan';
const DEFAULT_TRANSLATEY = 0;
const DEFAULT_OPACITY = 0.7;
const DEFAULT_PULSE_SCALE = 1;

export const ClanGroupPreview = memo(({ targetItem, dragItem, clans }: GroupPreviewProps) => {
	const styles = style();
	const translateY = useSharedValue(DEFAULT_TRANSLATEY);
	const opacity = useSharedValue(DEFAULT_OPACITY);
	const pulseScale = useSharedValue(DEFAULT_PULSE_SCALE);

	useEffect(() => {
		translateY.value = withSpring(-5, {
			damping: 15,
			stiffness: 150,
			mass: 0.8
		});
		opacity.value = withTiming(1, { duration: 200 });
		pulseScale.value = withSequence(
			withTiming(1.05, { duration: 150, easing: Easing.out(Easing.ease) }),
			withSpring(1, { damping: 10, stiffness: 200 })
		);
	}, []);

	const animatedContainerStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: pulseScale.value }, { translateY: translateY.value }] as const,
			opacity: opacity.value
		};
	});

	const previewGroupData = useMemo(() => {
		if (dragItem?.type === CLAN && targetItem?.type === CLAN) {
			const dragClanId = dragItem?.clan?.clan_id;
			const targetClanId = targetItem?.clan?.clan_id;
			return {
				id: `preview-group-${targetClanId}-${dragClanId}`,
				clanIds: [targetClanId, dragClanId],
				isExpanded: false
			};
		}

		return null;
	}, [targetItem, dragItem]);

	if (!previewGroupData) {
		return null;
	}

	return (
		<Animated.View style={[styles.previewGroupContainer, animatedContainerStyle]}>
			<ClanGroup group={previewGroupData} onClanPress={undefined} clans={clans} drag={undefined} isActive={false} />
		</Animated.View>
	);
});
