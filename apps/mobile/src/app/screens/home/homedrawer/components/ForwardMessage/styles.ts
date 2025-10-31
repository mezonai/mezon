import { baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: any) =>
	StyleSheet.create({
		listContainer: {
			height: '100%',
			paddingHorizontal: size.s_16
		},
		inputSearch: {
			borderRadius: size.s_8,
			height: size.s_36
		},
		btn: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: baseColor.blurple,
			paddingVertical: size.s_14,
			borderRadius: 50,
			marginHorizontal: size.s_10,
			marginBottom: size.s_24
		},
		btnText: {
			color: 'white',
			fontSize: size.medium
		},
		memberAvatar: {
			height: size.s_34,
			width: size.s_34,
			borderRadius: 50,
			backgroundColor: '#676b73'
		},
		groupAvatarDefaultContainer: {
			backgroundColor: baseColor.orange,
			width: size.s_34,
			height: size.s_34,
			borderRadius: size.s_20,
			justifyContent: 'center',
			alignItems: 'center'
		},
		memberAvatarDefaultContainer: {
			height: size.s_34,
			width: size.s_34,
			justifyContent: 'center',
			borderRadius: 50,
			backgroundColor: themeValue.colorAvatarDefault
		},
		memberAvatarDefaultText: {
			textAlign: 'center',
			fontSize: size.s_16,
			color: themeValue.textStrong
		},
		groupAvatarContainer: {
			width: size.s_34,
			height: size.s_34,
			borderRadius: size.s_20,
			overflow: 'hidden'
		},
		iconTextContainer: {
			width: size.s_16,
			height: size.s_34,
			justifyContent: 'center'
		},
		renderContentContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			height: size.s_50,
			gap: size.s_6,
			justifyContent: 'center'
		},
		container: {
			flex: 1,
			paddingHorizontal: size.s_16,
			paddingTop: size.s_16
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginBottom: size.s_18
		},
		headerSide: {
			flex: 1
		},
		headerTitle: {
			fontSize: verticalScale(18),
			color: themeValue.white
		},
		inputWrapper: {
			backgroundColor: themeValue.primary,
			paddingHorizontal: size.s_6
		},
		contentWrapper: {
			marginTop: size.s_12,
			marginBottom: size.s_12,
			flex: 1
		}
	});
