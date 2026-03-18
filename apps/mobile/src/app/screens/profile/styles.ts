import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.secondary,
			flex: 1,
			alignItems: 'center'
		},

		containerBackground: {
			width: '100%',
			height: '20%'
		},
		backgroundImage: {
			height: '100%',
			width: '100%',
			position: 'absolute',
			zIndex: 0
		},

		backgroundListIcon: {
			flexDirection: 'row',
			gap: size.s_10,
			paddingTop: size.s_15,
			justifyContent: 'flex-end',
			paddingHorizontal: size.s_15,
			top: size.s_150 + size.s_20
		},

		backgroundSetting: {
			backgroundColor: colors.tertiary,
			height: size.s_30,
			width: size.s_30,
			borderRadius: size.s_50,
			alignItems: 'center',
			justifyContent: 'center',
			gap: 5,
			flexDirection: 'row'
		},

		text: {
			color: colors.text,
			fontSize: isTabletLandscape ? size.label : size.s_14
		},

		token: {
			paddingVertical: size.s_4
		},

		whiteText: {
			color: 'white',
			fontSize: isTabletLandscape ? size.label : size.s_14
		},

		textTitle: {
			color: colors.textStrong,
			marginRight: size.s_6,
			fontWeight: 'bold',
			fontSize: isTabletLandscape ? size.s_16 : size.s_12
		},

		button: {
			alignItems: 'center',
			justifyContent: 'center',
			gap: size.s_8,
			backgroundColor: colors.bgViolet,
			borderRadius: 50,
			flex: 1,
			paddingVertical: size.s_10,
			flexDirection: 'row'
		},

		viewImageProfile: {
			position: 'absolute',
			width: '90%',
			left: isTabletLandscape ? size.s_30 : size.s_18,
			bottom: isTabletLandscape ? -size.s_100 : -size.s_70
		},

		imageProfile: {
			width: isTabletLandscape ? size.s_100 * 1.4 : size.s_90,
			height: isTabletLandscape ? size.s_100 * 1.4 : size.s_90,
			borderRadius: isTabletLandscape ? size.s_70 : size.s_24,
			backgroundColor: colors.secondary,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.25,
			shadowRadius: 6,
			overflow: 'visible'
		},

		textAvatar: {
			textAlign: 'center',
			fontSize: size.h4,
			color: baseColor.white,
			fontWeight: 'bold'
		},

		dotStatusUser: {
			right: isTabletLandscape ? size.s_12 : 0,
			bottom: isTabletLandscape ? size.s_4 : 0,
			overflow: 'visible'
		},

		contentContainer: {
			backgroundColor: colors.border,
			borderRadius: size.s_20,
			padding: size.s_18,
			marginTop: size.s_10,
			borderWidth: 1,
			borderColor: colors.border
		},

		viewInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingRight: size.s_10,
			maxWidth: '100%'
		},

		textName: {
			fontSize: size.s_16,
			fontWeight: 'bold',
			color: colors.textStrong,
			marginRight: size.s_8
		},

		buttonList: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: size.s_20,
			gap: size.s_10,
			flex: 1
		},
		buttonListLandscape: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignSelf: 'flex-end',
			marginTop: size.s_20,
			marginRight: size.s_30,
			gap: size.s_30,
			width: '40%',
			height: size.s_50
		},
		contentWrapper: {
			paddingHorizontal: isTabletLandscape ? size.s_30 : size.s_18,
			width: '100%',
			marginTop: isTabletLandscape ? size.s_50 : size.s_80
		},
		imageContainer: {
			position: 'absolute'
		},
		listImageFriend: {
			flexDirection: 'row',
			alignItems: 'center',
			width: '100%',
			flex: 1,
			justifyContent: 'flex-end'
		},
		imgWrapper: {
			width: '100%',
			height: '100%',
			borderRadius: isTabletLandscape ? size.s_70 : size.s_20,
			overlayColor: colors.secondary,
			overflow: 'hidden'
		},
		imgList: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			flex: 1
		},
		imageFriend: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: 50,
			borderWidth: 3,
			borderColor: colors.secondary
		},
		closeBtnUserStatus: { padding: size.s_4 },
		customUserStatusBtn: { flex: 1, paddingVertical: size.s_10 },
		textStatus: {
			color: colors.text,
			fontSize: isTabletLandscape ? size.label : size.s_14
		},
		badgeStatusTemp: {
			position: 'absolute',
			left: 0,
			top: size.s_24,
			width: size.s_30,
			height: size.s_24,
			borderStyle: 'solid',
			borderLeftWidth: 0,
			borderRightWidth: size.s_30,
			borderTopWidth: size.s_24,
			borderBottomWidth: 0,

			borderRightColor: 'transparent',
			borderTopColor: colors.primary
		},
		badgeStatus: {
			position: 'absolute',
			gap: size.s_6,
			flexDirection: 'row',
			left: (isTabletLandscape ? size.s_100 * 1.4 : size.s_100) + size.s_10,
			bottom: size.s_100,
			height: size.s_40,
			minWidth: size.s_50,
			borderRadius: size.s_12,
			maxWidth: isTabletLandscape ? '40%' : '70%',
			backgroundColor: colors.primary,
			justifyContent: 'flex-start',
			alignItems: 'center',
			paddingHorizontal: size.s_8,
			overflow: 'visible'
		},
		badgeStatusInside: {
			position: 'absolute',
			left: size.s_16,
			top: size.s_30,
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			backgroundColor: colors.primary
		},
		iconAddStatus: {
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_4,
			backgroundColor: '"rgba(148,156,248,1)"',
			justifyContent: 'center',
			alignItems: 'center'
		},
		buttonEnableWallet: {
			alignItems: 'center',
			justifyContent: 'center',
			gap: size.s_8,
			flexShrink: 1,
			backgroundColor: colors.primary,
			borderRadius: 50,
			paddingVertical: size.s_10,
			flexDirection: 'row'
		},
		shopSettingRow: {
			flexDirection: 'row',
			gap: size.s_10
		},
		defaultAvatarContainer: {
			backgroundColor: colors.colorAvatarDefault,
			overflow: 'hidden',
			width: '100%',
			height: '100%',
			borderRadius: isTabletLandscape ? size.s_70 : size.s_50,
			alignItems: 'center',
			justifyContent: 'center'
		},
		scrollContentContainer: {
			paddingBottom: size.s_100
		},
		touchStatusMargin: {
			marginBottom: size.s_10,
			top: size.s_14,
			left: size.s_4,
			maxWidth: '70%'
		},
		tokenRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_18
		},
		tokenRowMargin: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_18,
			marginTop: size.s_10
		},
		contentGap: {
			gap: size.s_20
		},
		customStyleIcon: {
			marginLeft: size.s_4
		},
		absoluteFill: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		}
	});
