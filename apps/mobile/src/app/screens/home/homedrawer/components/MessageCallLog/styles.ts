import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: size.s_4,
			borderRadius: size.s_10,
			overflow: 'hidden',
			marginTop: size.s_4,
			backgroundColor: colors.secondaryLight
		},
		wrapper: {
			padding: size.s_10
		},
		titleRed: {
			color: baseColor.redStrong,
			fontSize: size.medium,
			fontWeight: 'bold'
		},
		title: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: 'bold'
		},
		description: {
			color: colors.textDisabled,
			marginTop: size.s_6,
			fontSize: size.small
		},
		btnCallBack: {
			padding: size.s_8,
			borderTopColor: colors.secondaryWeight,
			borderTopWidth: 1
		},
		titleCallBack: {
			color: colors.textLink,
			fontSize: size.small,
			textTransform: 'uppercase',
			textAlign: 'center',
			fontWeight: 'bold'
		},
		wrapperDescription: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4
		},
		outerWrapper: {
			flexDirection: 'row'
		},
		iconWrapper: {
			top: size.s_2
		}
	});
