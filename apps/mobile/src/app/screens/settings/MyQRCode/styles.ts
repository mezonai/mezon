import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.secondary
		},
		card: {
			marginTop: size.s_30,
			marginHorizontal: size.s_30,
			padding: size.s_10,
			borderRadius: size.s_10
		},
		avatar: {
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_10
		},
		nameProfile: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '600'
		},
		tokenProfile: {
			color: colors.textDisabled,
			marginTop: size.s_4,
			fontSize: size.s_14
		},
		imageQR: {
			alignSelf: 'center',
			marginVertical: size.s_40,
			width: size.s_100 * 2.5,
			height: size.s_100 * 2.5,
			borderRadius: size.s_6
		}
	});
