import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
import { transparent } from 'tailwindcss/colors';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			position: 'relative',
			height: '100%',
			width: '100%'
		},
		userStreamingRoomContainer: {
			backgroundColor: baseColor.black
		},
		menuHeader: {
			width: '100%',
			backgroundColor: transparent,
			padding: 10,
			borderRadius: 10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		menuFooter: {
			position: 'absolute',
			bottom: 20,
			width: '100%',
			padding: size.s_20,
			gap: size.s_10,
			alignItems: 'center',
			justifyContent: 'center'
		},
		textMenuItem: {
			fontSize: 16,
			color: colors.white,
			fontWeight: '500'
		},
		buttonCircle: {
			backgroundColor: colors.border,
			padding: size.s_8,
			borderRadius: size.s_22
		},
		btnVoice: {
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			alignItems: 'center',
			borderRadius: size.s_22,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6
		},
		subTitle: {
			fontSize: size.s_14,
			color: colors.textDisabled,
			fontWeight: '400'
		},
		lineBtn: { width: '100%', alignItems: 'center', padding: size.s_6 },
		menuIcon: {
			justifyContent: 'center',
			alignItems: 'center',
			position: 'relative',
			width: size.s_60,
			height: size.s_60,
			backgroundColor: colors.badgeHighlight,
			borderRadius: size.s_30
		},
		addPeopleBtn: {
			padding: size.s_20,
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			borderRadius: size.s_16
		},
		bgVoice: {
			width: '100%',
			height: '100%'
		}
	});
