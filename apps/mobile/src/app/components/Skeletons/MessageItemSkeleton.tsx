import { size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';

const styles = StyleSheet.create({
	wrapper: {
		flexDirection: 'row',
		gap: size.s_14,
		marginBottom: size.s_20,
		paddingHorizontal: size.s_10
	},
	avatar: { width: size.s_40, height: size.s_40, borderRadius: 50 },
	bigText: { marginBottom: size.s_10, height: size.s_16, borderRadius: size.s_8 },
	normalText: { height: size.s_16, borderRadius: size.s_6, marginBottom: size.s_10 }
});

const MessageItemSkeleton = ({ skeletonNumber }: { skeletonNumber: number }) => {
	const { themeValue } = useTheme();
	return (
		<>
			{Array.from({ length: skeletonNumber }).map((_, index) => (
				<View style={styles.wrapper} key={index}>
					<ShimmerPlaceHolder
						shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
						shimmerStyle={styles.avatar}
						LinearGradient={LinearGradient}
					/>

					<View>
						<ShimmerPlaceHolder
							width={100}
							shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
							shimmerStyle={styles.bigText}
							LinearGradient={LinearGradient}
						/>
						<ShimmerPlaceHolder
							width={200}
							shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
							shimmerStyle={styles.normalText}
							LinearGradient={LinearGradient}
						/>
						{index % 2 ? (
							<ShimmerPlaceHolder
								width={300}
								shimmerColors={[themeValue.secondaryLight, themeValue.charcoal, themeValue.jet]}
								shimmerStyle={styles.normalText}
								LinearGradient={LinearGradient}
							/>
						) : null}
					</View>
				</View>
			))}
		</>
	);
};
export default MessageItemSkeleton;
