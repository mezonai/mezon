import { Attributes, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		headerContainer: {
			paddingTop: size.s_12,
			paddingLeft: size.s_8,
			marginBottom: size.s_10
		},
		headerText: {
			fontSize: verticalScale(18),
			color: colors.white
		},
		itemWrapper: {
			backgroundColor: colors.primary,
			borderRadius: size.s_8,
			marginBottom: size.s_8
		},
		emptyContainer: {
			alignItems: 'center',
			flex: 1,
			justifyContent: 'center'
		},
		emptyText: {
			color: colors.textDisabled
		}
	});
