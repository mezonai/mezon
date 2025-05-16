import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			padding: size.s_10,
			height: '100%'
		},
		tabContainer: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			gap: 10,
			padding: 6,
			backgroundColor: colors.secondary,
			borderRadius: 50
		},
		selected: {
			borderRadius: 50,
			paddingHorizontal: 20,
			paddingVertical: 6
		},
		textInput: {
			color: colors.text,
			flexGrow: 1,
			flexBasis: 10,
			fontSize: size.medium,
			height: size.s_40
		},

		textInputWrapper: {
			flex: 1,
			display: 'flex',
			flexDirection: 'row',
			marginVertical: 10,
			alignItems: 'center',
			paddingHorizontal: 10,
			borderRadius: 10,
			gap: 10,
			backgroundColor: colors.secondary
		}
	});
