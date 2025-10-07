import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			flex: 1,
			paddingHorizontal: size.s_14
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
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
		roleName: {
			position: 'absolute',
			alignSelf: 'center',
			width: '100%',
			zIndex: -1
		},
		name: {
			textAlign: 'center',
			fontWeight: 'bold',
			fontSize: size.s_18,
			color: colors.white,
			maxWidth: '50%',
			alignSelf: 'center'
		},
		backButton: {
			padding: size.s_16
		},
		emptyText: {
			color: colors.text,
			textAlign: 'center'
		},
		saveButton: {
			marginRight: size.s_14
		},
		saveText: {
			color: colors.bgViolet,
			fontSize: size.s_16
		},
		wrapper: {
			backgroundColor: colors.primary,
			flex: 1,
			paddingHorizontal: size.s_14,
			justifyContent: 'space-between'
		},
		flex: {
			flex: 1
		},
		permissionTitle: {
			paddingVertical: size.s_10,
			borderBottomWidth: 1,
			borderBottomColor: colors.borderDim,
			marginBottom: size.s_20
		},
		text: {
			color: colors.white,
			textAlign: 'center',
			fontWeight: 'bold',
			fontSize: size.s_24
		},
		permissionPanel: {
			marginVertical: size.s_10,
			flex: 1
		},
		permissionList: {
			borderRadius: size.s_10,
			overflow: 'hidden'
		},
		permissionItem: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			padding: size.s_12,
			gap: size.s_10
		},
		permissionDescription: {
			fontSize: size.s_10,
			marginTop: size.s_4,
			lineHeight: size.s_16,
			color: colors.textDisabled
		},
		switchContainer: {
			paddingTop: size.s_2
		},
		bottomButton: {
			marginBottom: size.s_16,
			gap: size.s_10
		},
		finishButton: {
			backgroundColor: colors.bgViolet,
			paddingVertical: size.s_14,
			borderRadius: size.s_8
		},
		buttonText: {
			color: 'white',
			textAlign: 'center'
		},
		cancelButton: {
			paddingVertical: size.s_14,
			borderRadius: size.s_8
		}
	});
