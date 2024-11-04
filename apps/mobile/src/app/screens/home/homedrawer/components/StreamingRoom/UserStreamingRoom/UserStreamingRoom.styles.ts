import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		userContainer: {
			width: '100%',
			height: '100%',
			margin: 5,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_16
		},
		userText: {
			color: colors.white,
			fontSize: size.s_14,
			fontWeight: '600'
		},
		userNameBox: {
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			alignItems: 'center',
			borderRadius: size.s_22,
			marginTop: size.s_30,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6,
			gap: size.s_6
		},
		gridContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
			alignItems: 'center',
			marginTop: size.s_30
		},
		userItem: {
			width: size.s_50,
			height: size.s_50,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: 25
		},
		remainingCount: {
			width: size.s_50,
			height: size.s_50,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: baseColor.gray,
			borderRadius: 25
		},
		textBold: {
			fontSize: size.regular,
			fontWeight: '700',
			color: colors.white
		}
	});
