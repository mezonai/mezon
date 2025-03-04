import { Attributes, Colors, size } from '@mezon/mobile-ui';
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
			width: 100,
			borderRadius: 3,
			paddingVertical: 5,
			marginRight: 10
		},
		radioItemDeActive: {
			backgroundColor: Colors.secondary
		},
		radioItemActive: {
			backgroundColor: Colors.bgViolet
		},
		inviteHeader: {
			backgroundColor: colors.tertiary,
			padding: 19,
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
			fontSize: 15,
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
			borderRadius: 8,
			alignItems: 'center',
			paddingHorizontal: size.s_6,
			flexDirection: 'row'
		},
		searchFriendToInviteInput: {
			width: '93%',
			borderRadius: 8,
			color: colors.white,
			paddingVertical: 0,
			height: size.s_50
		},
		editInviteLinkWrapper: {
			paddingTop: 17,
			flexDirection: 'row'
		},
		inviteWrapper: {
			flex: 1,
			backgroundColor: Colors.bgCharcoal,
			width: '100%',
			borderTopRightRadius: 8,
			borderTopLeftRadius: 8
		},
		iconAreaWrapper: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: 19,
			borderBottomColor: Colors.bgCharcoal,
			borderBottomWidth: 1
		},
		searchInviteFriendWrapper: {
			padding: 19
		},
		defaultText: {
			color: colors.text
		},
		linkText: {
			color: Colors.textLink
		},
		channelInviteTitle: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: Colors.tertiary
		},
		channelInviteItem: {
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 19,
			borderRadius: 5
		},
		inviteChannelListWrapper: {
			marginVertical: 15,
			paddingVertical: 20,
			borderBottomWidth: 2,
			borderTopWidth: 2,
			borderColor: Colors.borderPrimary,
			paddingHorizontal: 10
		},
		inviteChannelListTitle: {
			color: Colors.header1,
			fontSize: 16,
			fontWeight: '500'
		},
		advancedSettingWrapper: {
			paddingLeft: 10,
			gap: 10
		},
		advancedSettingTitle: {
			color: Colors.header1,
			fontSize: 16,
			fontWeight: '500'
		},
		advancedSettingSubTitle: {
			color: Colors.header2,
			fontSize: 16,
			fontWeight: '500'
		},
		temporaryMemberWrapper: {
			justifyContent: 'space-between',
			flexDirection: 'row',
			paddingTop: 20,
			paddingRight: 10
		},
		temporaryMemberTitle: {
			color: Colors.textGray,
			fontSize: 16
		},
		textUnknown: {
			textAlign: 'center',
			color: Colors.white,
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
			backgroundColor: colors.tertiary,
			borderTopRightRadius: 8,
			borderTopLeftRadius: 8
		},
		bottomSheetContainer: {
			marginHorizontal: isTabletLandscape ? marginWidth : 0
		}
	});
