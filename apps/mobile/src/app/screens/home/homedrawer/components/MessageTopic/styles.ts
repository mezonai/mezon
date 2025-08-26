import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		fakeBox: {
			height: size.s_30,
			width: size.s_30,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_10
		},
		container: {
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_10,
			marginVertical: size.s_4,
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4,
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_6
		},
		dateMessageBox: {
			paddingLeft: size.small,
			fontSize: size.small,
			color: baseColor.gray
		},
		repliesText: {
			fontSize: size.small,
			color: colors.textLink
		},
		username: {
			fontSize: size.small,
			fontWeight: 'bold'
		}
	});
