import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			height: size.s_60,
			alignItems: 'center',
			marginVertical: size.s_16,
			marginHorizontal: size.s_10,
			borderRadius: size.s_16,
			borderWidth: 1,
			borderColor: colors.border,
			paddingHorizontal: size.s_16,
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		setupTitle: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: 'bold'
		},
		description: {
			color: colors.text,
			fontSize: size.small
		},
		bgIcon: {
			borderRadius: size.s_16,
			height: size.s_28,
			width: size.s_28,
			overflow: 'visible',
			justifyContent: 'center',
			alignItems: 'center'
		},
		contentWrap: {
			justifyContent: 'center',
			alignItems: 'center',
			flexDirection: 'row',
			gap: size.s_10
		},
		titleGroup: {
			height: size.s_30,
			width: size.s_30,
			borderRadius: size.s_30,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: baseColor.blurple
		}
	});
