import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { styles as createStyles } from './styles';

const SkeletonItem = ({ position, styles, themeValue }: { position: 'left' | 'right'; styles: any; themeValue: any }) => {
	return (
		<View style={styles.timelineItemWrapper}>
			<View style={styles.timelineLineSegment} />
			<View style={styles.timelineDot} />

			{/* Date Skeleton */}
			<View style={[styles.timelineDate, position === 'left' ? styles.timelineDateRight : styles.timelineDateLeft]}>
				<ShimmerPlaceHolder
					LinearGradient={LinearGradient}
					style={{ width: 30, height: 10, marginBottom: 4, borderRadius: 4 }}
					shimmerColors={[themeValue.secondary, themeValue.secondaryLight, themeValue.secondary]}
				/>
				<ShimmerPlaceHolder
					LinearGradient={LinearGradient}
					style={{ width: 40, height: 30, marginBottom: 4, borderRadius: 4 }}
					shimmerColors={[themeValue.secondary, themeValue.secondaryLight, themeValue.secondary]}
				/>
				<ShimmerPlaceHolder
					LinearGradient={LinearGradient}
					style={{ width: 30, height: 10, borderRadius: 4 }}
					shimmerColors={[themeValue.secondary, themeValue.secondaryLight, themeValue.secondary]}
				/>
			</View>

			{/* Card Skeleton */}
			<View style={[styles.eventCardContainer, position === 'left' ? styles.eventCardLeft : styles.eventCardRight]}>
				<View style={styles.eventCard}>
					<ShimmerPlaceHolder
						LinearGradient={LinearGradient}
						style={{ width: '80%', height: 18, marginBottom: 8, borderRadius: 4 }}
						shimmerColors={[themeValue.secondary, themeValue.secondaryLight, themeValue.secondary]}
					/>
					<ShimmerPlaceHolder
						LinearGradient={LinearGradient}
						style={{ width: '100%', height: 14, marginBottom: 12, borderRadius: 4 }}
						shimmerColors={[themeValue.secondary, themeValue.secondaryLight, themeValue.secondary]}
					/>
					<ShimmerPlaceHolder
						LinearGradient={LinearGradient}
						style={{ width: '100%', height: 120, borderRadius: 12 }}
						shimmerColors={[themeValue.secondary, themeValue.secondaryLight, themeValue.secondary]}
					/>
				</View>
			</View>
		</View>
	);
};

export const TimelineSkeleton = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);

	return (
		<View style={styles.scrollContent}>
			{[1, 2, 3].map((_, index) => (
				<SkeletonItem key={index} position={index % 2 === 0 ? 'left' : 'right'} styles={styles} themeValue={themeValue} />
			))}
		</View>
	);
};
