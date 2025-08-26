import { Attributes, size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			flexDirection: 'row',
			gap: size.s_14,
			marginTop: size.s_20,
			paddingHorizontal: size.s_10,
			backgroundColor: 'transparent'
		},
		avatar: { width: size.s_40, height: size.s_40, borderRadius: size.s_40, backgroundColor: colors.secondaryLight },
		smailText: { marginBottom: size.s_10, height: size.s_16, borderRadius: size.s_10, width: size.s_100, backgroundColor: colors.secondaryLight },
		normalText: {
			marginBottom: size.s_10,
			height: size.s_16,
			borderRadius: size.s_10,
			width: size.s_220,
			backgroundColor: colors.secondaryLight
		},
		bigText: {
			marginBottom: size.s_10,
			height: size.s_16,
			borderRadius: size.s_10,
			width: size.s_150 * 2,
			backgroundColor: colors.secondaryLight
		}
	});

const MessageItemSkeleton = ({ skeletonNumber }: { skeletonNumber: number }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<>
			{Array.from({ length: skeletonNumber }).map((_, index) => (
				<View style={styles.wrapper} key={index}>
					<View style={styles.avatar} />

					<View>
						<View style={styles.smailText} />
						<View style={styles.normalText} />
						{index % 2 ? <View style={styles.bigText} /> : null}
					</View>
				</View>
			))}
		</>
	);
};
export default MessageItemSkeleton;
