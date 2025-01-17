import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			flex: 1,
			height: '100%',
			borderTopLeftRadius: 20,
			overflow: 'hidden',
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_20,
			marginTop: size.s_50
		},
		headerText: {
			fontSize: size.s_20,
			color: colors.white,
			fontWeight: '600'
		},
		imageBg: {
			width: '100%',
			height: '40%',
			resizeMode: 'contain',
			marginVertical: size.s_30
		},
		title: {
			fontSize: size.h6,
			marginBottom: size.s_10,
			color: colors.text,
			fontWeight: '700',
			textAlign: 'center'
		},
		description: {
			fontSize: size.label,
			color: colors.textDisabled,
			textAlign: 'center'
		},
		joinClan: {
			width: '80%',
			alignSelf: 'center',
			padding: size.s_10,
			backgroundColor: Colors.bgButton,
			borderRadius: size.s_50,
			marginBottom: size.s_10
		},
		createClan: {
			width: '100%',
			padding: size.s_10,
			backgroundColor: Colors.transparent,
			borderWidth: 2,
			borderColor: Colors.bgDarkCharcoal,
			borderRadius: size.s_50
		},
		textCreateClan: {
			fontSize: size.label,
			color: Colors.textGray,
			fontWeight: '600',
			textAlign: 'center'
		},
		textJoinClan: {
			fontSize: size.label,
			color: Colors.white,
			fontWeight: '600',
			textAlign: 'center'
		}
	});
