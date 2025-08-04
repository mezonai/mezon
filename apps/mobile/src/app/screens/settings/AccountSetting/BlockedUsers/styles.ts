import { Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: themeValue.background,
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
			backgroundColor: themeValue.secondary,
			borderBottomWidth: size.s_2,
			borderBottomColor: themeValue.background
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
			backgroundColor: themeValue.primary,
			justifyContent: 'center',
			alignItems: 'center'
		},
		avatarText: {
			color: themeValue.text,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		username: {
			fontSize: size.s_16,
			fontWeight: '500',
			color: themeValue.text
		},
		unblockButton: {
			backgroundColor: Colors.textRed,
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
			color: themeValue.text,
			fontSize: size.s_16
		}
	});
