import { Attributes } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			width: Dimensions.get('screen').width
		},

		btnIcon: {
			padding: 7,
			borderRadius: 10,
			backgroundColor: colors.bgViolet
		},

		btnGroup: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			paddingHorizontal: 10,
			marginTop: -20
		}
	});
