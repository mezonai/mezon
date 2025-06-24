import { Attributes, Colors, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		content: {
			height: (Metrics.screenWidth - size.s_6 * size.s_10) / 5.1,
			width: (Metrics.screenWidth - size.s_6 * size.s_10) / 5.1,
			borderRadius: 10,
			overflow: 'hidden',
			backgroundColor: Colors.black
		},

		audioContent: {
			width: (Metrics.screenWidth - size.s_30) / 2,
			borderRadius: 10,
			overflow: 'hidden',
			borderWidth: 1,
			borderColor: colors.border,
			alignItems: 'center',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6
		},

		btnEmo: {
			width: 30,
			height: 30,
			borderRadius: 50,
			overflow: 'hidden',
			backgroundColor: Colors.black
		},

		btnWrap: {
			display: 'flex',
			flexDirection: 'row',
			gap: size.s_10,
			marginTop: size.s_10
		},

		session: {},

		sessionTitle: {
			fontSize: size.medium,
			color: Colors.tertiary,
			fontWeight: '600',
			textTransform: 'capitalize',
			marginTop: size.s_20,
			marginBottom: size.s_10
		},

		sessionContent: {
			display: 'flex',
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: size.s_10,
			alignItems: 'center'
		},

		soundName: {
			fontSize: size.medium,
			color: colors.text,
			maxWidth: '80%',
			marginTop: size.s_6,
			textAlign: 'center'
		}
	});
