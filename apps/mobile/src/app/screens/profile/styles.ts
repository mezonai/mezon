import { Attributes, baseColor, size } from '@mezon/mobile-ui';
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

		backgroundListIcon: {
			flexDirection: 'row',
			gap: size.s_10,
			paddingTop: size.s_15,
			justifyContent: 'flex-end',
			paddingHorizontal: size.s_15
		},

		backgroundSetting: {
			backgroundColor: colors.secondary,
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
			bottom: isTabletLandscape ? -size.s_100 : -size.s_50
		},

		imageProfile: {
			width: isTabletLandscape ? size.s_100 * 1.4 : size.s_100,
			height: isTabletLandscape ? size.s_100 * 1.4 : size.s_100,
			borderRadius: isTabletLandscape ? size.s_70 : size.s_50,
			backgroundColor: colors.secondary,
			borderWidth: 5,
			borderColor: colors.secondary
		},

		textAvatar: {
			textAlign: 'center',
			fontSize: size.h4,
			color: baseColor.white,
			fontWeight: 'bold'
		},

		dotStatusUser: {
			right: isTabletLandscape ? size.s_12 : size.s_6,
			bottom: isTabletLandscape ? size.s_4 : size.s_2
		},

		contentContainer: {
			backgroundColor: colors.primary,
			borderRadius: size.s_20,
			padding: size.s_18,
			marginTop: size.s_10,
			borderWidth: 1,
			borderColor: colors.border
		},

		viewInfo: {
			flexDirection: 'row',
			alignItems: 'center'
		},

		textName: {
			fontSize: size.s_20,
			fontWeight: 'bold',
			color: colors.textStrong,
			marginRight: 10
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
			marginTop: isTabletLandscape ? size.s_40 : size.s_50
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
			borderRadius: isTabletLandscape ? size.s_70 : size.s_50,
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
			left: (isTabletLandscape ? size.s_100 * 1.4 : size.s_100) + size.s_12,
			bottom: size.s_60,
			width: size.s_12,
			height: size.s_12,
			borderRadius: size.s_12,
			backgroundColor: colors.primary
		},
		badgeStatus: {
			position: 'absolute',
			gap: size.s_6,
			flexDirection: 'row',
			left: (isTabletLandscape ? size.s_100 * 1.4 : size.s_100) + size.s_10,
			bottom: size.s_16,
			height: size.s_40,
			minWidth: size.s_50,
			borderRadius: size.s_20,
			maxWidth: isTabletLandscape ? '40%' : '70%',
			backgroundColor: colors.primary,
			justifyContent: 'flex-start',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			overflow: 'visible'
		},
		badgeStatusInside: {
			position: 'absolute',
			left: size.s_16,
			top: -size.s_8,
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			backgroundColor: colors.primary
		},
		iconAddStatus: {
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			backgroundColor: colors.text,
			justifyContent: 'center',
			alignItems: 'center'
		}
	});
