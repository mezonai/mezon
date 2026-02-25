import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { styles as createStyles } from './styles';

export const AlbumDetailSkeleton = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const shimmerColors = [themeValue.secondary, themeValue.secondaryLight, themeValue.secondary];

	return (
		<View style={styles.gridContainer}>
			{/* Description skeleton */}
			<View style={styles.descriptionContainer}>
				<ShimmerPlaceHolder
					LinearGradient={LinearGradient}
					style={{ width: '90%', height: 14, borderRadius: 4, marginBottom: 6 }}
					shimmerColors={shimmerColors}
				/>
				<ShimmerPlaceHolder
					LinearGradient={LinearGradient}
					style={{ width: '60%', height: 14, borderRadius: 4 }}
					shimmerColors={shimmerColors}
				/>
			</View>

			{/* Featured image skeleton */}
			<View style={styles.wrapperImageContainer}>
				<ShimmerPlaceHolder
					LinearGradient={LinearGradient}
					style={{ width: '100%', height: 300, borderRadius: 16 }}
					shimmerColors={shimmerColors}
				/>
			</View>

			{/* Grid items skeleton */}
			<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
				{[1, 2, 3, 4].map((item) => (
					<View key={item} style={styles.gridItem}>
						<ShimmerPlaceHolder
							LinearGradient={LinearGradient}
							style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }}
							shimmerColors={shimmerColors}
						/>
					</View>
				))}
			</View>
		</View>
	);
};
