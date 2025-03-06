import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		createChannelContainer: {
			backgroundColor: colors.primary,
			height: '100%',
			width: '100%',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_16
		},
		paginationButton: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_15,
			marginHorizontal: size.s_4,
			marginVertical: size.s_10,
			backgroundColor: colors.badgeHighlight,
			justifyContent: 'center',
			alignItems: 'center'
		},
		paginationContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			position: 'absolute',
			bottom: 0,
			backgroundColor: colors.primary,
			width: '100%'
		},
		paginationButtonText: {
			color: colors.text,
			fontSize: size.label,
			fontWeight: 'bold'
		},
		textPage: {
			color: colors.text
		},
		disableButton: {
			color: colors.textDisabled
		},
		normalButton: {
			color: colors.textStrong
		},
		scrollView: {
			height: '95%'
		}
	});
