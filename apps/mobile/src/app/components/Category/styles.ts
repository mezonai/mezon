import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			padding: Metrics.size.xl,
			display: 'flex',
			flexDirection: 'column',
			gap: size.s_10
		},
		label: {
			color: 'white',
			textTransform: 'uppercase',
			paddingHorizontal: size.s_20
		},
		labelNormal: {
			color: 'white'
		},
		labelIconWrapper: {
			display: 'flex',
			alignItems: 'center',
			flexDirection: 'row',
			gap: size.s_10
		},
		description: {
			marginTop: size.s_10,
			paddingHorizontal: size.s_20,
			color: baseColor.gray,
			fontSize: Fonts.size.small
		},
		input: {
			backgroundColor: '#242427',
			marginVertical: size.s_10,
			color: 'white',
			paddingHorizontal: size.s_20,
			paddingVertical: 0,
			height: size.s_50
		},
		checkboxWrapper: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_10,
			backgroundColor: '#242427'
		}
	});
