import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			paddingVertical: size.s_18,
			paddingHorizontal: size.s_10,
			width: '100%',
			height: '100%',
			backgroundColor: colors.primary
		},
		optionsBox: {
			borderRadius: 8,
			overflow: 'hidden',
			paddingHorizontal: size.s_10,
			backgroundColor: colors.secondary
		},
		wrapperItem: {
			paddingVertical: size.s_20,
			paddingHorizontal: size.s_10,
			backgroundColor: '#323232',
			borderBottomColor: baseColor.gray,
			borderBottomWidth: 0.5
		},
		wrapperUnmuteBox: {
			paddingVertical: size.s_20,
			paddingHorizontal: size.s_10,
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			alignItems: 'center'
		},
		wrapperItemNotification: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			paddingVertical: size.s_20,
			paddingHorizontal: size.s_10,
			backgroundColor: colors.secondary,
			borderRadius: 8,
			marginTop: size.s_20
		},
		option: {
			color: colors.text,
			fontSize: size.label,
			fontWeight: '500'
		},
		InfoTitle: {
			color: colors.textDisabled,
			fontSize: size.medium,
			fontWeight: '500',
			marginTop: size.s_10
		},
		duration: {
			color: baseColor.blurple,
			fontSize: size.medium,
			fontWeight: '500',
			marginTop: size.s_10
		},
		textUntil: {
			color: colors.textDisabled,
			fontSize: size.medium,
			fontWeight: '500',
			marginTop: size.s_10
		}
	});
