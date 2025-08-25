import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: size.s_10,
			paddingBottom: size.s_14,
			borderBottomColor: colors.secondaryLight,
			borderBottomWidth: 1,
			maxHeight: '40%'
		},
		dateText: {
			fontSize: size.small,
			color: baseColor.gray
		},
		name: {
			fontSize: size.medium,
			marginRight: size.s_10,
			fontWeight: '700'
		},
		title: {
			fontSize: size.label,
			color: colors.text,
			fontWeight: '700'
		},
		titlePanel: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'flex-end',
			height: size.s_20,
			gap: size.s_6
		},
		userInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			marginVertical: size.s_10
		},
		headerPannel: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		backButton: {
			width: size.s_50,
			paddingVertical: size.s_4
		}
	});
