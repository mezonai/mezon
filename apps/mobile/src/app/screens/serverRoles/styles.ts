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
			paddingVertical: size.s_14
		},
		description: {
			textAlign: 'center',
			color: colors.text
		},
		everyOneRole: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			padding: size.s_12,
			borderRadius: size.s_12
		},
		editButton: {
			flexDirection: 'row',
			flex: 1,
			gap: size.s_10
		},
		flex: {
			flex: 1
		},
		leadIcon: {
			backgroundColor: colors.tertiary,
			borderRadius: size.s_50,
			padding: size.s_8
		},
		text: {
			color: colors.white
		},
		normalText: {
			color: colors.text
		},
		roles: {
			marginTop: size.s_10,
			flex: 1
		},
		listRolePanel: {
			marginVertical: size.s_10,
			flex: 1
		},
		roleList: {
			borderRadius: size.s_10,
			overflow: 'hidden'
		},
		roleItem: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			padding: size.s_12,
			gap: size.s_10
		},
		itemTitle: {
			flexDirection: 'row',
			gap: size.s_6
		},
		emptyRole: {
			marginTop: size.s_20
		},
		emptyText: {
			textAlign: 'center',
			color: colors.text
		},
		addRole: {
			padding: size.s_20
		}
	});
