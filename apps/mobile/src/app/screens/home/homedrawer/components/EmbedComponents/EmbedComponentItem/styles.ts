import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		button: {
			height: size.s_40,
			paddingHorizontal: size.s_20,
			backgroundColor: colors.bgViolet,
			borderRadius: size.s_4,
			justifyContent: 'center',
			alignItems: 'center'
		},
		buttonLabel: {
			color: baseColor.white,
			fontSize: size.medium
		}
	});
