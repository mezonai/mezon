import { Attributes, baseColor, Colors, size } from '@mezon/mobile-ui';
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
			paddingRight: size.s_15
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
			fontSize: isTabletLandscape ? size.label : size.medium
		},

		whiteText: {
			color: Colors.white,
			marginLeft: 10,
			fontSize: isTabletLandscape ? size.label : size.medium
		},

		textTitle: {
			color: colors.textStrong,
			fontWeight: 'bold',
			fontSize: isTabletLandscape ? size.s_16 : size.s_12
		},

		button: {
			alignItems: 'center',
			justifyContent: 'center',
			gap: size.s_4,
			backgroundColor: Colors.bgViolet,
			borderRadius: 50,
			flex: 1,
			paddingVertical: size.s_10,

			flexDirection: 'row'
		},

		viewImageProfile: {
			position: 'absolute',
			width: isTabletLandscape ? size.s_100 * 1.4 : size.s_100,
			height: isTabletLandscape ? size.s_100 * 1.4 : size.s_100,
			borderRadius: isTabletLandscape ? size.s_70 : size.s_50,
			backgroundColor: colors.secondary,
			left: isTabletLandscape ? size.s_30 : size.s_18,
			bottom: isTabletLandscape ? -size.s_100 : -size.s_50,
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
			marginTop: size.s_20,
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
			flex: 1
		},
		contentWrapper: {
			paddingHorizontal: isTabletLandscape ? size.s_30 : size.s_18,
			width: '100%',
			marginTop: isTabletLandscape ? size.s_40 : size.s_60
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
			borderRadius: isTabletLandscape ? size.s_70 : size.s_50
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
		customUserStatusBtn: { flex: 1, paddingVertical: size.s_10 }
	});
