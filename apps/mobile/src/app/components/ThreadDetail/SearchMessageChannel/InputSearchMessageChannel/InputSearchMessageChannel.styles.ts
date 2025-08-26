import { Attributes, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			flexDirection: 'row',
			backgroundColor: 'transparent',
			paddingBottom: size.s_20,
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_20,
			marginVertical: size.s_10,
			marginBottom: -size.s_10
		},
		searchBox: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			borderRadius: verticalScale(50),
			flex: 1,
			height: size.s_40,
			paddingHorizontal: size.s_10,
			marginRight: size.s_10,
			justifyContent: 'space-between'
		},
		input: {
			color: colors.text,
			flex: 1,
			textAlignVertical: 'center',
			height: size.s_40,
			paddingVertical: 0
		},
		listSearchIcon: {
			backgroundColor: colors.secondary,
			opacity: 0.7,
			padding: size.s_10,
			borderRadius: verticalScale(50)
		},
		channelLabel: {
			fontSize: size.label,
			fontWeight: '600',
			color: colors.white
		},
		textBadgeHighLight: { color: colors.white, fontSize: size.s_12, fontWeight: '500', width: '100%' }
	});
