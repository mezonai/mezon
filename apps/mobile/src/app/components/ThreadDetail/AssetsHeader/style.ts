import { Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		headerTab: {
			marginTop: 20,
			padding: 10,
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center'
		},

		tabLabel: {
			color: 'white'
		},

		a: {
			width: '100%',
			paddingHorizontal: 20,
			position: 'relative',
			marginBottom: 10
		},
		b: {
			position: 'absolute',
			backgroundColor: colors.bgViolet,
			height: 3,
			top: 0,
			borderRadius: 50
		},
		itemTab: {
			paddingHorizontal: 10
		},
		itemTabActive: {
			marginTop: 5,
			width: '100%',
			height: 2,
			backgroundColor: 'black'
		}
	});
