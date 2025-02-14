import { Metrics, size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { style } from './styles';

export default function SkeletonNotification({ numberSkeleton }: { numberSkeleton: number }) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={{ paddingHorizontal: Metrics.size.m, flex: 1 }}>
			{Array.from({ length: numberSkeleton }).map((_, index) => (
				<View key={`ChannelListSkeleton_${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: size.s_20 }}>
					<ShimmerPlaceHolder
						shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
						shimmerStyle={styles.avatar}
						LinearGradient={LinearGradient}
					/>

					<View style={{ flex: 1 }}>
						<ShimmerPlaceHolder
							shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
							shimmerStyle={styles.normalText}
							LinearGradient={LinearGradient}
						/>
						{index % 2 ? (
							<View>
								<ShimmerPlaceHolder
									shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
									shimmerStyle={styles.mediumText}
									LinearGradient={LinearGradient}
								/>
								<ShimmerPlaceHolder
									shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
									shimmerStyle={styles.smallText}
									LinearGradient={LinearGradient}
								/>
							</View>
						) : (
							<View>
								<ShimmerPlaceHolder
									shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
									shimmerStyle={styles.smallText}
									LinearGradient={LinearGradient}
								/>
								<ShimmerPlaceHolder
									shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
									shimmerStyle={styles.smallText}
									LinearGradient={LinearGradient}
								/>
								<ShimmerPlaceHolder
									shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
									shimmerStyle={styles.mediumText}
									LinearGradient={LinearGradient}
								/>
							</View>
						)}
					</View>
					<ShimmerPlaceHolder
						shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
						shimmerStyle={{ ...styles.avatar, width: size.s_30, height: size.s_30 }}
						LinearGradient={LinearGradient}
					/>
				</View>
			))}
		</View>
	);
}
