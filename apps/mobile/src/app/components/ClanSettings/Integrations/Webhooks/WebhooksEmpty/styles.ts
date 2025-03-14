import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		title: {
			fontSize: size.regular,
			color: colors.white,
			fontWeight: '500',
			marginTop: size.s_10
		},
		subTitle: {
			fontSize: size.label,
			color: colors.textDisabled,
			fontWeight: '500',
			textAlign: 'center'
		},
		hookEmpty: {
			height: 145,
			width: 272
		}
	});
