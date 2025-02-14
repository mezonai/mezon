import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { style } from './styles';

export default function SkeletonMessageItem({ numberSkeleton }: { numberSkeleton: number }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={{ flex: 1 }}>
			{Array.from({ length: numberSkeleton }).map((_, index) => (
				<View key={`MessageItemSkeleton_${index}`} style={[styles.messageItem, { flexDirection: 'row' }]}>
					<ShimmerPlaceHolder
						shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
						shimmerStyle={styles.avatar}
						LinearGradient={LinearGradient}
					/>

					<View style={{ flex: 1, justifyContent: 'center' }}>
						<ShimmerPlaceHolder
							shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
							shimmerStyle={styles.normalText}
							LinearGradient={LinearGradient}
						/>
						<ShimmerPlaceHolder
							shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
							shimmerStyle={styles.smallText}
							LinearGradient={LinearGradient}
						/>
					</View>
				</View>
			))}
		</View>
	);
}
