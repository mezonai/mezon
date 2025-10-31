import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			height: size.s_60,
			width: '90%',
			backgroundColor: 'transparent',
			flexDirection: 'row',
			alignItems: 'center',
			borderLeftColor: 'transparent',
			paddingLeft: size.s_20,
			borderLeftWidth: 0,
			shadowColor: 'transparent',
			elevation: 2,
			overflow: 'hidden'
		},
		iconWrapper: {
			padding: size.s_4,
			backgroundColor: baseColor.white,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_50
		},
		text: {
			color: colors.text
		},
		white: {
			color: colors.white
		},
		notificationContainer: {
			width: '90%',
			height: 'auto',
			flex: 1,
			top: size.s_2,
			backgroundColor: colors.secondary,
			borderWidth: size.s_2,
			borderColor: colors.primary,
			borderRadius: size.s_16,
			overflow: 'hidden',
			shadowOffset: { width: 0, height: 0 },
			shadowOpacity: 0.9,
			shadowRadius: 5,
			elevation: 8
		},
		notificationContent: {
			alignItems: 'stretch',
			width: '100%',
			flexDirection: 'row',
			height: 'auto',
			gap: size.s_10,
			padding: size.s_10
		},
		notificationLogo: {
			height: size.s_40,
			width: size.s_40,
			borderRadius: 50
		},
		lottieProgressBar: {
			width: '100%',
			height: size.s_8
		},
		toastWrapper: {
			top: size.s_2,
			borderRadius: size.s_20,
			overflow: 'hidden',
			width: '90%'
		},
		titleBaseStyle: {
			fontSize: size.medium,
			color: baseColor.black,
			fontWeight: '600'
		},
		descriptionBaseStyle: {
			fontSize: size.small,
			color: baseColor.black,
			fontWeight: '400'
		},
		toastSuccessBackground: {
			backgroundColor: '#b6e1c6'
		},
		toastErrorBackground: {
			backgroundColor: '#efc3ca'
		},
		toastInfoBackground: {
			backgroundColor: '#b6e1c6'
		},
		contentContainerStyle: {
			paddingHorizontal: size.s_20
		},
		trailingIconContainer: {
			marginRight: -size.s_30
		},
		notificationTextContainer: {
			flexDirection: 'column',
			flex: 1
		},
		notificationTitle: {
			fontSize: size.h5,
			marginLeft: 0,
			marginRight: 0,
			fontWeight: 'bold',
			color: colors.white
		},
		notificationBody: {
			fontSize: size.h6,
			marginLeft: 0,
			marginRight: 0,
			color: colors.textStrong
		},
		notificationProgressBarContainer: {
			transform: [{ rotateY: '180deg' }],
			height: size.s_4,
			overflow: 'hidden'
		}
	});

export const createBubbleStyle = (size: number, position: any, color: string) =>
	StyleSheet.create({
		bubble: {
			position: 'absolute',
			backgroundColor: color,
			height: size,
			width: size,
			borderRadius: size / 2,
			...position,
			elevation: 1
		}
	});
