import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		avatar: {
			height: 35,
			width: 35,
			overflow: 'hidden',
			borderRadius: 50
		},

		avatarContainer: {
			position: 'relative',
			width: 35,
			height: 35,
			borderRadius: 50
		},

		statusWrapper: {
			backgroundColor: colors.secondary,
			padding: 2,
			position: 'absolute',
			bottom: -4,
			right: -4,
			borderRadius: 50
		},

		nameContainer: {
			flexDirection: 'row',
			gap: size.s_6,
			flexGrow: 1,
			borderBottomColor: colors.borderDim,
			minHeight: size.s_50,
			alignItems: 'center',
			paddingVertical: size.s_8
		},
		nameItem: {
			gap: size.s_4,
			justifyContent: 'center',
			width: '100%'
		},

		container: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12,
			paddingHorizontal: size.s_12,
			width: '100%'
		}
	});
