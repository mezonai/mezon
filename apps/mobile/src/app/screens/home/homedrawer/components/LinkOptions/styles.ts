import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		bottomSheetWrapper: {
			minHeight: '100%',
			overflow: 'hidden',
			paddingBottom: size.s_20
		},

		bottomSheetBarWrapper: {
			height: 20,
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: 'transparent'
		},

		bottomSheetBar: {
			width: size.s_30,
			height: size.s_4,
			borderRadius: 20,
			backgroundColor: colors.textStrong
		},

		headerWrapper: {
			paddingHorizontal: 20,
			paddingBottom: 10
		},

		headerTitle: {
			color: colors.text,
			fontWeight: 'bold',
			fontSize: size.h4,
			textAlign: 'center'
		},

		headerLink: {
			color: colors.text,
			fontSize: size.h9,
			marginBottom: size.s_10,
			textAlign: 'center'
		},

		messageActionGroup: {
			backgroundColor: colors.secondary,
			marginHorizontal: size.s_20,
			borderRadius: size.s_10,
			overflow: 'hidden',
			gap: 1
		},

		actionItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_12,
			backgroundColor: colors.secondary,
			borderBottomWidth: 0.5,
			borderBottomColor: colors.border
		},

		actionText: {
			color: colors.text,
			fontSize: size.h6
		}
	});
