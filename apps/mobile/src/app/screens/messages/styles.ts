import { Attributes, baseColor, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTablet?: boolean) =>
	StyleSheet.create({
		containerMessages: {
			flex: 1,
			flexDirection: 'row',
			backgroundColor: colors.tertiary
		},

		containerServerlist: {
			paddingHorizontal: size.s_10
		},

		container: {
			backgroundColor: isTablet ? colors.primary : colors.secondary,
			flex: 1
		},

		leftContainer: {
			flex: 2
		},

		containerDetailMessage: {
			flex: 5
		},

		headerWrapper: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: size.s_20,
			paddingHorizontal: size.s_18
		},

		friendsWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4,
			marginTop: size.s_14,
			paddingVertical: size.s_6,
			borderRadius: size.s_10,
			paddingHorizontal: size.s_8,
			marginHorizontal: size.s_18
		},

		headerTitle: {
			fontSize: isTablet ? size.s_16 : size.s_18,
			color: colors.textStrong
		},

		addFriendWrapper: {
			flexDirection: 'row',
			gap: size.s_8,
			alignItems: 'center',
			backgroundColor: isTablet ? colors.secondary : colors.primary,
			borderRadius: size.s_20,
			borderWidth: 1,
			borderColor: colors.border,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6
		},

		addFriendText: {
			fontSize: isTablet ? size.small : size.medium,
			color: colors.textStrong
		},

		searchMessage: {
			backgroundColor: isTablet ? colors.secondary : colors.primary,
			borderRadius: 40,
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginHorizontal: size.s_18
		},

		searchInput: {
			borderRadius: 20,
			height: isTablet ? size.s_34 : size.s_50,
			color: colors.textStrong,
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_12,
			fontSize: size.medium,
			flex: 1
		},

		statusTyping: {
			position: 'absolute',
			width: size.s_30,
			height: size.s_16,
			borderRadius: 10,
			bottom: -2,
			right: -6,
			borderWidth: 3,
			alignItems: 'center',
			justifyContent: 'center',
			borderColor: colors.secondary
		},

		statusCircle: {
			position: 'absolute',
			width: size.s_14,
			height: size.s_14,
			borderRadius: 10,
			bottom: 0,
			right: 0,
			borderWidth: 2,
			borderColor: colors.secondary
		},

		messageItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			marginTop: size.s_10,
			marginHorizontal: size.s_10,
			paddingHorizontal: size.s_8,
			paddingVertical: size.s_6,
			borderRadius: size.s_10
		},
		friendAvatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20,
			overlayColor: colors.primary,
			overflow: 'hidden'
		},

		messageContent: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: size.s_2
		},

		online: {
			backgroundColor: baseColor.green
		},
		offline: {
			backgroundColor: Colors.bgGrayDark
		},

		defaultText: {
			color: colors.text,
			fontSize: size.medium
		},

		addMessage: {
			position: 'absolute',
			bottom: isTablet ? size.s_10 : size.s_100,
			right: size.s_10,
			width: size.s_50,
			height: size.s_50,
			backgroundColor: baseColor.blurple,
			borderRadius: size.s_50,
			alignItems: 'center',
			justifyContent: 'center'
		},

		groupAvatar: {
			backgroundColor: Colors.orange,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_50,
			justifyContent: 'center',
			alignItems: 'center'
		},

		lastMessage: {
			color: colors.textStrong,
			fontSize: size.small
		},

		dateTime: {
			fontSize: size.s_12
		},

		channelLabel: {
			fontSize: size.s_14,
			color: colors.white,
			fontWeight: '500',
			flex: 1
		},
		avatarWrapper: {
			borderRadius: size.s_50,
			backgroundColor: colors.colorAvatarDefault,
			height: size.s_40,
			width: size.s_40
		},
		wrapperTextAvatar: {
			width: size.s_40,
			height: size.s_40,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h6,
			color: Colors.white
		},
		lottie: { width: size.s_30, height: size.s_20 },
		contentMessage: {
			flex: 1,
			maxHeight: size.s_20,
			flexDirection: 'row',
			alignItems: 'flex-end',
			flexWrap: 'nowrap',
			overflow: 'hidden'
		},
		textQuantityPending: { fontSize: size.s_12, color: colors.white }
	});
