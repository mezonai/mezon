import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		requestFriendContainer: {
			backgroundColor: colors.primary,
			flex: 1,
			padding: size.s_18,
			gap: size.s_18
		},
		toggleWrapper: {
			backgroundColor: colors.tertiary,
			padding: Metrics.size.s,
			flexDirection: 'row',
			borderRadius: size.s_16,
			gap: size.s_6
		},
		tab: {
			paddingVertical: size.s_6,
			borderRadius: size.s_16,
			flex: 1
		},
		activeTab: {
			backgroundColor: baseColor.blurple
		},
		tabTitle: {
			textAlign: 'center',
			color: colors.text
		},
		activeTabTitle: {
			color: 'white'
		},
		groupWrapper: {
			borderRadius: size.s_12,
			overflow: 'hidden'
		}
	});
