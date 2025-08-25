import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

const marginWidth = Dimensions.get('screen').width * 0.3;

export const style = (colors: Attributes, isTabletLandscape?: boolean) =>
	StyleSheet.create({
		radioContainer: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center'
		},
		radioItem: {
			width: size.s_100,
			borderRadius: size.s_4,
			paddingVertical: size.s_4,
			marginRight: size.s_10
		},
		radioItemDeActive: {
			backgroundColor: colors.secondary
		},
		radioItemActive: {
			backgroundColor: colors.bgViolet
		},
		inviteHeader: {
			padding: size.s_16,
			width: '100%'
		},
		inviteList: {
			backgroundColor: colors.secondary,
			borderRadius: size.s_10,
			marginHorizontal: size.s_16
		},
		inviteHeaderText: {
			color: colors.white,
			fontWeight: 'bold',
			fontSize: size.s_15,
			textAlign: 'center'
		},
		inviteIconWrapper: {
			justifyContent: 'center',
			alignItems: 'center'
		},
		shareToInviteIconWrapper: {
			height: size.s_40,
			width: size.s_40,
			borderRadius: size.s_40,
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			overflow: 'hidden'
		},
		shareToInviteIcon: {
			color: colors.white
		},
		inviteIconText: {
			color: colors.text,
			paddingTop: size.s_6
		},
		searchFriendToInviteWrapper: {
			backgroundColor: colors.bgInputPrimary,
			borderRadius: size.s_8,
			alignItems: 'center',
			paddingHorizontal: size.s_6,
			flexDirection: 'row'
		},
		searchFriendToInviteInput: {
			width: '93%',
			borderRadius: size.s_8,
			color: colors.white,
			paddingVertical: 0,
			height: size.s_40
		},
		editInviteLinkWrapper: {
			paddingTop: size.s_16,
			flexDirection: 'row'
		},
		inviteWrapper: {
			flex: 1,
			backgroundColor: '#313338',
			width: '100%',
			borderTopRightRadius: size.s_8,
			borderTopLeftRadius: size.s_8
		},
		iconAreaWrapper: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: size.s_16,
			borderBottomColor: '#313338',
			borderBottomWidth: 1
		},
		searchInviteFriendWrapper: {
			padding: size.s_16
		},
		defaultText: {
			color: colors.text
		},
		linkText: {
			color: baseColor.link
		},
		channelInviteTitle: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: colors.tertiary
		},
		channelInviteItem: {
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: size.s_16,
			borderRadius: size.s_4
		},
		inviteChannelListWrapper: {
			marginVertical: size.s_15,
			paddingVertical: size.s_20,
			borderBottomWidth: 2,
			borderTopWidth: 2,
			borderColor: colors.borderRadio,
			paddingHorizontal: size.s_10
		},
		inviteChannelListTitle: {
			color: '#888c94',
			fontSize: size.s_16,
			fontWeight: '500'
		},
		advancedSettingWrapper: {
			paddingLeft: size.s_10,
			gap: size.s_10
		},
		advancedSettingTitle: {
			color: '#888c94',
			fontSize: size.s_16,
			fontWeight: '500'
		},
		advancedSettingSubTitle: {
			color: '#676b73',
			fontSize: size.s_16,
			fontWeight: '500'
		},
		temporaryMemberWrapper: {
			justifyContent: 'space-between',
			flexDirection: 'row',
			paddingTop: size.s_20,
			paddingRight: size.s_10
		},
		temporaryMemberTitle: {
			color: baseColor.gray,
			fontSize: size.s_16
		},
		textUnknown: {
			textAlign: 'center',
			color: 'white',
			paddingHorizontal: size.s_16,
			fontSize: size.label,
			fontWeight: '600',
			marginTop: size.s_16
		},
		bottomSheetWrapper: {
			flex: 1,
			width: '100%',
			height: '100%',
			overflow: 'hidden',
			paddingBottom: size.s_10,
			backgroundColor: colors.primary,
			borderTopRightRadius: size.s_8,
			borderTopLeftRadius: size.s_8
		},
		bottomSheetContainer: {
			marginHorizontal: isTabletLandscape ? marginWidth : 0
		},
		qrButtonContainer: {
			paddingHorizontal: size.s_16,
			paddingBottom: size.s_16,
			alignItems: 'center'
		},
		qrButton: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: colors.bgViolet,
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_12,
			borderRadius: size.s_8,
			gap: size.s_8
		},
		qrButtonText: {
			color: colors.white,
			fontSize: size.s_16,
			fontWeight: '600'
		}
	});
