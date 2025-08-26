import { Attributes, size } from '@mezon/mobile-ui';
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
			color: colors.white
		},
		backButton: {
			padding: size.s_16
		},
		addMember: {
			flex: 1,
			paddingTop: size.s_10
		},
		addMemberTitle: {
			paddingVertical: size.s_10,
			borderBottomWidth: 1,
			borderBottomColor: colors.borderDim,
			marginBottom: size.s_20
		},
		addMemberText: {
			color: colors.white,
			textAlign: 'center',
			fontWeight: 'bold',
			fontSize: size.s_24
		},
		addMemberDescription: {
			color: colors.text,
			textAlign: 'center'
		},
		addMemberButton: {
			flexDirection: 'row',
			backgroundColor: colors.secondary,
			padding: size.s_10,
			borderRadius: size.s_6,
			gap: size.s_10,
			justifyContent: 'center',
			alignItems: 'center'
		},
		text: {
			color: colors.text
		},
		flex: {
			flex: 1
		},
		memberList: {
			marginVertical: size.s_10,
			flex: 1
		},
		listWrapper: {
			borderRadius: size.s_10,
			overflow: 'hidden'
		},
		emptyText: {
			color: colors.text,
			textAlign: 'center'
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
