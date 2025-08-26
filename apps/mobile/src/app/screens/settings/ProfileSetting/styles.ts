import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			flex: 1,
			paddingBottom: 20
		},
		backArrow: {
			paddingLeft: size.s_12
		},
		saveChangeButton: {
			paddingRight: size.s_12,
			fontSize: size.regular
		},
		changed: {
			color: baseColor.blurple
		},
		notChange: {
			color: '#939292'
		}
	});
