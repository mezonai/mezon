import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		avatarWrapper: {
			borderRadius: 50,
			backgroundColor: colors.colorAvatarDefault,
			height: size.s_60,
			width: size.s_60
		},
		container: {
			padding: Metrics.size.xl,
			paddingTop: 0
		},
		groupAvatar: {
			backgroundColor: baseColor.orange,
			width: size.s_60,
			height: size.s_60,
			borderRadius: 50,
			justifyContent: 'center',
			alignItems: 'center'
		},
		friendAvatar: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: 50
		},
		wrapperTextAvatar: {
			width: size.s_60,
			height: size.s_60,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h4,
			color: 'white'
		},
		serverName: {
			color: colors.textStrong,
			fontSize: Fonts.size.h6,
			fontWeight: '700'
		},

		header: {
			gap: Metrics.size.l,
			flexDirection: 'row',
			alignItems: 'center'
		},
		titleWrapper: {
			flexDirection: 'column',
			gap: Metrics.size.s,
			flex: 1
		},
		actionWrapper: {
			flexDirection: 'row',
			gap: Metrics.size.m,
			padding: Metrics.size.m,
			justifyContent: 'space-between',
			minWidth: '100%'
		},
		memberText: {
			color: colors.white,
			fontSize: Fonts.size.h7
		}
	});
