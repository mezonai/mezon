import { Attributes, baseColor, Fonts, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperItem: {
			flexDirection: 'row',
			borderBottomColor: colors.border,
			borderBottomWidth: 0.5,
			paddingHorizontal: 10,
			paddingVertical: 10,
			backgroundColor: colors.primary,
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		containerItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8
		},
		title: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.white
		},
		image: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: 50
		},
		symbol: {
			fontSize: size.label,
			fontWeight: '600',
			color: colors.text
		},
		subText: {
			fontSize: size.s_12,
			fontWeight: '500',
			color: colors.textDisabled,
			marginLeft: size.s_20,
			flex: 1,
			textAlign: 'right'
		},
		avatarMessageBoxDefault: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_50,
			backgroundColor: '#949AA4FF',
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatarMessageBoxDefault: {
			fontSize: size.s_22,
			color: colors.text
		},
		emojiImage: { width: size.s_20, height: size.s_20 },
		roleText: {
			color: colors.textRoleLink,
			fontSize: size.medium,
			fontWeight: '600'
		},
		textHere: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.white,
			flexBasis: '15%'
		},
		channelWrapper: {
			flexDirection: 'row',
			flexBasis: '50%',
			gap: size.s_8
		},
		channelBusyText: {
			color: baseColor.redStrong,
			fontStyle: 'italic',
			fontSize: Fonts.size.h7
		},
		streamIcon: {
			marginTop: size.s_4
		}
	});
