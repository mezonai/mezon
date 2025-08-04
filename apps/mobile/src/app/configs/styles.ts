import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			height: size.s_50,
			width: '80%',
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_40,
			flexDirection: 'row',
			alignItems: 'center',
			borderLeftColor: 'transparent',
			paddingHorizontal: size.s_20
		},
		iconWrapper: {
			width: size.s_20,
			height: size.s_20
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
			backgroundColor: colors.primary,
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
			height: size.s_8,
			marginBottom: -size.s_4
		}
	});
