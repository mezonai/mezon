import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			flex: 1,
			paddingHorizontal: size.s_14
		},
		nameInput: {
			marginTop: size.s_14
		},
		wrapper: {
			marginVertical: size.s_10,
			flex: 1
		},
		actionList: {
			borderRadius: size.s_10,
			overflow: 'hidden'
		},
		actionItem: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			padding: size.s_12,
			gap: size.s_10,
			height: size.s_50
		},
		actionTitleHeader: {
			flex: 1,
			flexDirection: 'row',
			gap: size.s_6
		},
		actionTitle: {
			color: colors.white
		},
		deleteView: {
			marginVertical: size.s_10
		},
		deleteButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			paddingVertical: size.s_14,
			paddingHorizontal: size.s_12,
			borderRadius: size.s_10
		},
		deleteText: {
			color: baseColor.redStrong
		},
		flex: {
			flex: 1
		},
		headerTitle: {
			fontSize: size.s_18,
			textAlign: 'center',
			fontWeight: 'bold',
			color: colors.white,
			maxWidth: '95%'
		},
		headerText: {
			textAlign: 'center',
			color: colors.white
		},
		saveButton: {
			marginRight: size.s_16
		},
		saveText: {
			fontSize: size.medium,
			textAlign: 'center',
			color: colors.bgViolet
		},
		backButton: {
			marginLeft: size.s_16
		},
		center: {
			alignItems: 'center',
			width: '80%',
			justifyContent: 'center',
			alignSelf: 'center'
		}
	});
