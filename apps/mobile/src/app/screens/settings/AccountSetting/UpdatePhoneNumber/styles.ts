import type { Attributes } from '@mezon/mobile-ui';
import { Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: themeValue.primary,
			padding: size.s_20
		},
		contentContainer: {
			marginBottom: size.s_10,
			position: 'relative'
		},
		label: {
			fontSize: size.s_12,
			color: themeValue.textDisabled,
			marginBottom: size.s_10
		},
		phoneContainer: {
			flexDirection: 'row',
			backgroundColor: themeValue.secondaryLight,
			borderWidth: 0,
			borderRadius: size.s_8,
			paddingVertical: size.s_2
		},
		countryButton: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			borderRightWidth: 1,
			borderRightColor: themeValue.border
		},
		inputWrapper: {
			backgroundColor: 'transparent',
			borderWidth: 0,
			marginBottom: -10
		},
		input: {
			fontSize: size.s_14,
			color: themeValue.text
		},
		nextButton: {
			backgroundColor: themeValue.textDisabled
		},
		nextButtonActive: {
			backgroundColor: themeValue.bgViolet
		},
		removeButton: {
			backgroundColor: themeValue.secondary
		},
		buttonTitle: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: 'white'
		},
		errorInput: {
			paddingHorizontal: Metrics.size.m
		},
		customStyleFlagIcon: {
			marginRight: size.s_6
		},
		errorContainer: {
			minHeight: size.s_30
		},
		phoneInputFlex: {
			flex: 1
		}
	});
