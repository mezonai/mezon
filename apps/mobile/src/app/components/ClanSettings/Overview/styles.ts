import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		headerActionTitle: {
			fontSize: size.s_16,
			color: baseColor.blurple,
			fontWeight: 'bold',
			paddingHorizontal: 20
		},
		container: {
			paddingHorizontal: 20,
			paddingVertical: 10,
			backgroundColor: colors.primary
		},
		errorInput: {
			paddingHorizontal: Metrics.size.m
		},
		mainContainer: {
			flex: 1
		},
		channelLabelText: {
			fontSize: size.s_12
		},
		clearBannerButton: {
			position: 'absolute',
			right: size.s_14,
			top: size.s_2
		},
		inputWrapper: {
			marginVertical: 10
		}
	});
