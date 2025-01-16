import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperProfile: {
			height: size.s_70,
			flexDirection: 'row',
			paddingHorizontal: size.s_20,
			alignItems: 'center',
			gap: size.s_8,
			backgroundColor: colors.secondary
		},
		imageWrapper: {
			height: size.s_50,
			width: size.s_50,
			borderRadius: size.s_50
		},
		userInfo: {
			justifyContent: 'center'
		},
		userName: {
			color: colors.white,
			fontSize: size.s_18
		},
		status: {
			color: colors.text,
			fontSize: size.s_14,
			width: '50%'
		}
	});
