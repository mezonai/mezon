import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			alignItems: 'center',
			padding: size.s_12,
			paddingTop: size.s_60
		},
		title: {
			marginTop: size.s_40,
			fontSize: size.h2,
			fontWeight: '600',
			color: colors.textStrong,
			textAlign: 'center'
		},
		text: {
			marginTop: size.s_10,
			fontSize: size.medium,
			color: colors.text,
			textAlign: 'center'
		},
		buttonCreate: {
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: size.s_40,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_20,
			backgroundColor: baseColor.blurple,
			borderRadius: size.s_8
		},
		buttonText: {
			color: baseColor.white,
			fontWeight: '600',
			fontSize: size.small
		},
		buttonJoin: {
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			marginTop: size.s_12,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_20,
			backgroundColor: baseColor.bgButtonSecondary,
			borderRadius: size.s_8
		}
	});
