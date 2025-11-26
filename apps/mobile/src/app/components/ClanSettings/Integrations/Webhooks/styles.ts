import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		description: {
			fontSize: size.s_12,
			color: colors.textDisabled,
			fontWeight: '400',
			marginBottom: size.s_40
		},
		textLink: {
			fontSize: size.s_12,
			color: colors.textLink,
			fontWeight: '400'
		},
		stickyNewButton: {
			position: 'absolute',
			bottom: size.s_24,
			right: size.s_24,
			zIndex: 100,
			backgroundColor: colors.bgViolet,
			borderRadius: size.s_10,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_12,
			shadowColor: colors.black,
			shadowOffset: { width: 0, height: size.s_2 },
			shadowOpacity: 0.2,
			shadowRadius: 4,
			elevation: 5
		},
		stickyNewButtonText: {
			color: baseColor.white,
			fontWeight: 'bold',
			fontSize: size.s_16,
			textAlign: 'center'
		},
		wrapper: {
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_16,
			backgroundColor: colors.primary,
			width: '100%',
			height: '100%'
		}
	});
