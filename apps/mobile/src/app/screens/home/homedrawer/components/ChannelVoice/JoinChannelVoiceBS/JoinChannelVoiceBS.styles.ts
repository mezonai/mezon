import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		buttonCircle: {
			backgroundColor: colors.tertiary,
			padding: size.s_8,
			borderRadius: size.s_22
		},
		text: { fontSize: size.s_20, fontWeight: '600', color: colors.text },
		textDisable: { fontSize: size.s_16, fontWeight: '400', color: colors.textDisabled },
		lineBtn: { width: '100%', alignItems: 'center', padding: size.s_10 },
		btnJoinVoice: {
			borderRadius: size.s_40,
			backgroundColor: baseColor.green,
			height: size.s_50,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textBtnJoinVoice: { fontSize: size.s_16, fontWeight: '600', color: baseColor.black },
		avatarCircle: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden',
			marginLeft: -5,
			borderWidth: 1,
			borderColor: colors.white,
			backgroundColor: colors.white
		},
		badgeContainer: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_50,
			borderWidth: 1,
			borderColor: colors.white,
			backgroundColor: colors.tertiary,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: -5
		},
		textBadge: {
			fontSize: size.s_12,
			fontWeight: '600',
			textAlign: 'center',
			color: colors.text
		},
		iconVoice: {
			padding: size.s_20,
			borderRadius: '100%',
			backgroundColor: colors.tertiary,
			justifyContent: 'center',
			alignItems: 'center'
		}
	});
