import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		defaultAvatar: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_50,
			backgroundColor: baseColor.orange,
			alignItems: 'center',
			justifyContent: 'center'
		},
		removeAvatarText: {
			marginTop: size.s_10,
			fontSize: size.s_12,
			fontWeight: '600',
			color: colors.textLink
		},
		label: {
			fontSize: size.label,
			fontWeight: '600',
			color: colors.text
		},
		headerCustomGroup: {
			fontSize: size.regular,
			fontWeight: '600',
			color: colors.white,
			textAlign: 'center'
		},
		labelInput: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: colors.text,
			marginBottom: size.s_10
		},
		saveButton: {
			backgroundColor: baseColor.blurple,
			borderRadius: size.s_8,
			paddingVertical: size.s_10,
			alignItems: 'center',
			marginTop: size.s_20
		},
		saveText: {
			color: baseColor.white,
			fontSize: size.s_14,
			fontWeight: '600',
			letterSpacing: 0.5
		}
	});

export default style;
