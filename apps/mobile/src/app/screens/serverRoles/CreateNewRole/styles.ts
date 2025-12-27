import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			width: '100%'
		},
		title: {
			position: 'absolute',
			alignSelf: 'center',
			width: '100%',
			textAlign: 'center',
			zIndex: -1,
			color: colors.textStrong,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		backButton: {
			padding: size.s_16
		},
		wrapper: {
			backgroundColor: colors.primary,
			flex: 1,
			paddingHorizontal: size.s_14,
			justifyContent: 'space-between'
		},
		button: {
			paddingVertical: size.s_14,
			borderRadius: size.s_8,
			justifyContent: 'center',
			alignItems: 'center'
		},
		buttonText: {
			color: 'white'
		},
		desciptionWrapper: {
			borderBottomWidth: 1,
			borderBottomColor: colors.borderDim,
			paddingBottom: size.s_10
		},
		newRole: {
			fontSize: size.s_24,
			textAlign: 'center',
			fontWeight: 'bold',
			color: colors.text
		},
		description: {
			textAlign: 'center',
			color: colors.text
		},
		input: {
			marginTop: size.s_18
		},
		bottom: {
			marginBottom: size.s_16
		}
	});
