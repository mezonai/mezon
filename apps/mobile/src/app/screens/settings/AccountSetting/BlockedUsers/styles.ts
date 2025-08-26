import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_16,
			paddingTop: size.s_16
		},
		listContent: {
			paddingBottom: size.s_20
		},
		userItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: size.s_8,
			paddingHorizontal: size.s_8,
			borderRadius: size.s_12,
			backgroundColor: colors.secondary,
			borderBottomWidth: size.s_2,
			borderBottomColor: colors.primary
		},
		userInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12,
			flex: 1
		},
		avatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20
		},
		avatarPlaceholder: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20,
			backgroundColor: colors.primary,
			justifyContent: 'center',
			alignItems: 'center'
		},
		avatarText: {
			color: colors.text,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		username: {
			fontSize: size.s_16,
			fontWeight: '500',
			color: colors.text
		},
		unblockButton: {
			backgroundColor: baseColor.redStrong,
			borderRadius: size.s_20,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8
		},
		unblockText: {
			color: 'white',
			fontWeight: 'bold'
		},
		emptyContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		emptyText: {
			color: colors.text,
			fontSize: size.s_16
		}
	});
