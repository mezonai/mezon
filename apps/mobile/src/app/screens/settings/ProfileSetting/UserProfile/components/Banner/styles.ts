import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		bannerContainer: {
			height: 150,
			width: '100%'
		},

		btnRound: {
			padding: 7,
			borderRadius: 50,
			backgroundColor: colors.primary
		},

		btnGroup: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-end',
			alignItems: 'center'
		},

		avatar: {
			height: size.s_100,
			width: size.s_100,
			borderRadius: 100,
			borderColor: colors.primary,
			borderWidth: 5
		},

		avatarContainer: {
			position: 'relative',
			marginTop: -65,
			marginLeft: 16,
			width: size.s_100
		},

		absolute: {
			position: 'absolute',
			top: 0,
			right: 0
		},

		onLineStatus: {
			position: 'absolute',
			bottom: 0,
			right: 5,
			height: size.s_24,
			width: size.s_24,
			borderRadius: 100,
			borderWidth: 3,
			backgroundColor: baseColor.green,
			borderColor: colors.primary
		}
	});
