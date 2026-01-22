import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			marginBottom: 10
		},
		fakeInput: {
			borderColor: colors.border,
			backgroundColor: colors.secondary,
			borderWidth: 1,
			borderRadius: 10
		},

		fakeInputFocus: {
			borderColor: colors.secondary
		},

		fakeInputBlur: {
			borderColor: 'transparent'
		},

		inputBox: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_4,
			paddingVertical: size.s_10
		},

		label: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: 'bold',
			marginBottom: Fonts.size.s_10
		},

		input: {
			paddingVertical: 0,
			paddingHorizontal: size.s_10,
			color: colors.textStrong,
			flexGrow: 1,
			flexShrink: 1,
			fontSize: size.medium
		},

		clearBtn: {
			borderRadius: 10,
			zIndex: 100,
			marginRight: size.s_10
		},

		lineCountWrapper: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-end',
			paddingBottom: 10
		},

		count: {
			color: colors.text,
			fontSize: Fonts.size.h8,
			marginRight: 10
		},

		errorInput: {
			paddingHorizontal: Metrics.size.m
		},

		titleUppercase: {
			fontSize: Fonts.size.h7,
			textTransform: 'uppercase'
		},

		required: {
			color: baseColor.redStrong
		}
	});
