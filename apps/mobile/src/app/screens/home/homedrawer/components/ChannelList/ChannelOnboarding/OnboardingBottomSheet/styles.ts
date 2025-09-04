import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			height: size.s_60,
			alignItems: 'center',
			marginHorizontal: size.s_16,
			marginVertical: size.s_8,
			borderRadius: size.s_20,
			borderWidth: 1,
			borderColor: colors.border,
			paddingHorizontal: size.s_16,
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		setupTitle: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '500'
		},
		description: {
			color: colors.textDisabled,
			fontSize: size.small,
			fontWeight: '500'
		},
		title: {
			width: '70%',
			textAlign: 'center',
			color: colors.textStrong,
			fontSize: size.s_24,
			fontWeight: 'bold',
			marginVertical: size.s_20
		},
		titleRow: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			gap: size.s_8
		},
		wrapper: {
			paddingVertical: size.s_16,
			paddingBottom: size.s_40
		},
		titleGroup: {
			justifyContent: 'center',
			alignItems: 'center',
			marginVertical: size.s_30
		},
		image: {
			height: size.s_100,
			width: size.s_100,
			backgroundColor: baseColor.azureBlue,
			borderRadius: size.s_50,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'visible',
			zIndex: 0
		},
		firstCircle: {
			height: size.s_50,
			width: size.s_50,
			borderRadius: size.s_50,
			position: 'absolute',
			backgroundColor: baseColor.azureBlue,
			zIndex: 4
		},
		secondCircle: {
			height: size.s_100 - size.s_14,
			width: size.s_100 - size.s_14,
			borderRadius: size.s_50,
			position: 'absolute',
			backgroundColor: baseColor.azureBlue,
			opacity: 0.2,
			zIndex: 3
		},
		thirdCircle: {
			height: size.s_100 - size.s_4,
			width: size.s_100 - size.s_4,
			borderRadius: size.s_100,
			position: 'absolute',
			backgroundColor: colors.primary,
			zIndex: 2
		},
		background: {
			height: size.s_100,
			width: size.s_100,
			borderRadius: size.s_100,
			position: 'absolute',
			backgroundColor: colors.primary,
			opacity: 0.9,
			zIndex: 1
		}
	});
