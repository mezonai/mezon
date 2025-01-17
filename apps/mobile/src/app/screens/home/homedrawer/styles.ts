import { Attributes, Colors, Fonts, Metrics, baseColor, horizontalScale, size, verticalScale } from '@mezon/mobile-ui';
import { Dimensions, Platform, StyleSheet } from 'react-native';
const width = Dimensions.get('window').width;
const inputWidth = width * 0.6;
export const style = (colors: Attributes) =>
	StyleSheet.create({
		mainList: {
			height: '100%',
			width: '78%',
			borderTopLeftRadius: size.s_10,
			borderTopRightRadius: size.s_10,
			overflow: 'hidden'
		},
		btnIcon: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.tertiary
		},
		closeIcon: {
			color: Colors.bgDarkSlate,
			backgroundColor: Colors.white,
			borderRadius: size.s_50,
			fontSize: size.s_20
		},
		iconContainer: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			alignItems: 'center',
			justifyContent: 'center'
		},
		containerInput: {
			flexDirection: 'row',
			justifyContent: 'space-around',
			alignItems: 'center',
			paddingVertical: size.s_10
		},
		wrapperInput: {
			position: 'relative',
			justifyContent: 'center',
			// backgroundColor: Colors.secondaryLight,
			// paddingVertical: size.s_4,
			borderRadius: size.s_22
		},
		inputStyle: {
			maxHeight: size.s_40 * 2,
			lineHeight: size.s_20,
			width: inputWidth,
			borderBottomWidth: 0,
			borderRadius: size.s_20,
			paddingLeft: Platform.OS === 'ios' ? size.s_16 : size.s_20,
			paddingRight: size.s_40,
			fontSize: size.medium,
			paddingTop: size.s_8,
			backgroundColor: colors.tertiary,
			color: colors.textStrong,
			textAlignVertical: 'center'
		},
		iconEmoji: {
			position: 'absolute',
			right: size.s_10
		},
		iconSend: {
			backgroundColor: baseColor.blurple
		},
		containerDrawerContent: {
			flex: 1,
			flexDirection: 'row',
			backgroundColor: Colors.secondary
		},
		homeDefault: {
			backgroundColor: colors.primary,
			flex: 1,
			zIndex: 10000
		},
		wrapperChannelMessage: {
			flex: 1,
			justifyContent: 'space-between',
			backgroundColor: colors.primary
		},
		listChannels: {
			paddingTop: size.s_14,
			backgroundColor: colors.secondary
		},
		channelListLink: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingRight: Metrics.size.l
		},
		channelListSection: {
			width: '100%',
			paddingHorizontal: size.s_8,
			marginBottom: size.s_20
		},
		channelListHeader: {
			width: '100%',
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: size.s_10
		},
		channelListHeaderItem: {
			flexDirection: 'row',
			alignItems: 'center'
		},
		channelListHeaderItemTitle: {
			textTransform: 'uppercase',
			fontSize: size.s_15,
			fontWeight: 'bold',
			color: Colors.tertiary,
			flexBasis: '75%'
		},
		channelListItem: {
			paddingHorizontal: size.s_10,
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: size.s_8,
			borderRadius: size.s_4
		},
		channelListItemActive: {
			backgroundColor: Colors.secondaryLight,
			borderRadius: size.s_10,
			borderWidth: 0.4,
			borderColor: Colors.gray48
		},
		channelListItemTitle: {
			fontSize: size.s_14,
			fontWeight: '600',
			marginLeft: size.s_6,
			color: Colors.tertiary
		},
		channelListItemTitleActive: {
			color: Colors.white
		},
		channelDotWrapper: {
			backgroundColor: Colors.textRed,
			height: size.s_10,
			width: size.s_10,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_10
		},
		channelDot: {
			color: Colors.white,
			fontSize: Fonts.size.h8
		},
		dotIsNew: {
			position: 'absolute',
			left: -size.s_10,
			width: size.s_6,
			height: size.s_6,
			borderRadius: size.s_6,
			backgroundColor: Colors.white
		},
		channelListSearch: {
			width: '100%',
			paddingHorizontal: size.s_8,
			marginBottom: size.s_16,
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: size.s_8
		},
		channelListSearchWrapperInput: {
			backgroundColor: Colors.tertiaryWeight,
			flex: 1,
			borderRadius: size.s_16,
			alignItems: 'center',
			paddingHorizontal: size.s_6,
			gap: size.s_10,
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		channelListSearchInput: {
			height: size.s_34,
			padding: 0,
			flex: 1
		},
		wrapperClanIcon: {
			alignItems: 'center',
			position: 'relative'
		},
		clanIcon: {
			height: verticalScale(50),
			width: verticalScale(50),
			borderRadius: verticalScale(50),
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: Colors.tertiaryWeight,
			borderWidth: 1,
			borderColor: Colors.borderDim
		},
		logoClan: {
			height: verticalScale(70),
			width: verticalScale(70),
			resizeMode: 'cover'
		},
		textLogoClanIcon: {
			color: Colors.titleReset,
			fontSize: size.s_22,
			fontWeight: '600'
		},
		homeDefaultHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_14,
			paddingVertical: size.s_8,
			paddingBottom: size.s_12
		},
		lineActiveClan: {
			backgroundColor: Colors.azureBlue,
			width: size.s_4,
			height: '80%',
			top: '10%',
			left: -size.s_13,
			borderTopRightRadius: size.s_10,
			borderBottomEndRadius: size.s_10,
			position: 'absolute'
		},
		clanIconActive: {
			backgroundColor: Colors.black,
			borderRadius: verticalScale(15)
		},
		containerThreadList: {
			paddingLeft: size.s_24,
			paddingBottom: size.s_14
		},
		titleThread: {
			flex: 1,
			fontSize: size.s_14,
			fontWeight: '600',
			marginLeft: size.s_6,
			color: Colors.tertiary,
			top: size.s_6
		},
		iconBar: {
			paddingRight: size.s_14
		},
		wrapperServerList: {
			height: '100%',
			paddingTop: size.s_20,
			width: '22%',
			justifyContent: 'flex-start',
			backgroundColor: Colors.primary,
			alignItems: 'center',
			gap: size.s_10
		},
		friendItemWrapper: {
			marginHorizontal: size.s_20,
			paddingVertical: size.s_10,
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		friendItemWrapperInvited: {
			opacity: 0.6
		},
		friendItemContent: {
			flexDirection: 'row'
		},
		friendItemName: {
			paddingTop: size.s_10,
			paddingLeft: size.s_10,
			lineHeight: size.s_20,
			color: colors.text,
			maxWidth: size.s_100 * 2
		},
		inviteButton: {
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_12,
			borderRadius: size.s_50,
			borderColor: colors.border,
			minWidth: size.s_60,
			backgroundColor: colors.tertiary
		},
		threadItem: {
			flexDirection: 'row',
			flexGrow: 1,
			alignItems: 'flex-end'
		},
		threadItemActive: {
			backgroundColor: Colors.secondaryLight,
			borderRadius: size.s_10,
			borderWidth: 0.4,
			borderColor: Colors.gray48,
			position: 'absolute',
			width: '95%',
			height: '90%',
			right: 0,
			top: size.s_16
		},
		threadFirstItemActive: {
			height: '160%',
			right: 0,
			top: size.s_2,
			backgroundColor: Colors.secondaryLight,
			borderRadius: size.s_10,
			borderWidth: 0.4,
			borderColor: Colors.gray48
		},
		wrapperMessageBox: {
			flexDirection: 'row',
			paddingLeft: size.s_6,
			marginBottom: size.s_2,
			paddingRight: size.s_20
		},
		aboveMessage: {
			flexDirection: 'row',
			marginTop: size.s_6,
			paddingLeft: size.s_10,
			gap: 15
		},
		iconReply: {
			width: size.s_34,
			height: '100%',
			alignItems: 'center',
			paddingLeft: size.s_30,
			marginTop: size.s_4
		},
		deletedMessageReplyIcon: {
			top: size.s_4
		},
		replyAvatar: {
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_50,
			backgroundColor: Colors.gray48,
			overflow: 'hidden'
		},
		messageWrapper: {
			flexDirection: 'column',
			marginTop: size.s_10
		},
		highlightMessageMention: {
			backgroundColor: colors.reactionBg
		},
		highlightMessageReply: {
			backgroundColor: Colors.bgMessageHighlight,
			borderLeftColor: Colors.borderMessageHighlight,
			borderLeftWidth: 2,
			paddingTop: size.s_2
		},
		repliedTextAvatar: {
			fontSize: size.s_12,
			color: Colors.white
		},
		repliedMessageWrapper: {
			flexDirection: 'row',
			gap: 8,
			marginRight: 0,
			marginTop: size.s_4
		},
		wrapperMessageBoxCombine: {
			// marginBottom: size.s_10,
		},
		rowMessageBox: {
			marginLeft: size.s_12,
			justifyContent: 'space-between',
			width: '90%'
		},
		rowMessageBoxCombine: {
			marginLeft: verticalScale(44)
		},
		messageBoxTop: {
			flexDirection: 'row',
			alignItems: 'flex-end',
			marginBottom: size.s_6
		},
		replyDisplayName: {
			color: Colors.caribbeanGreen,
			fontSize: size.small
		},
		replyContentWrapper: {
			width: '85%',
			flexDirection: 'row',
			alignItems: 'center',
			top: -size.s_8,
			gap: size.s_4
		},
		tapToSeeAttachmentText: {
			color: colors.text,
			fontSize: size.small
		},
		userNameMessageBox: {
			fontSize: size.medium,
			marginRight: size.s_10,
			fontWeight: '700',
			color: Colors.caribbeanGreen
		},
		dateMessageBox: {
			fontSize: size.small,
			color: Colors.gray72
		},
		contentMessageCombine: {
			padding: size.s_2
		},
		contentMessageLink: {
			fontSize: size.medium,
			color: Colors.textLink,
			lineHeight: size.s_20
		},
		loadMoreChannelMessage: {
			paddingVertical: size.s_20,
			alignItems: 'center',
			justifyContent: 'center'
		},
		avatarMessageBoxDefault: {
			width: '100%',
			height: '100%',
			borderRadius: size.s_50,
			backgroundColor: Colors.titleReset,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatarMessageBoxDefault: {
			fontSize: size.s_22,
			color: Colors.white
		},
		imageMessageRender: {
			borderRadius: verticalScale(5),
			marginVertical: size.s_6,
			borderWidth: 0.5,
			borderColor: Colors.borderPrimary
		},
		wrapperTypingLabel: {
			position: 'absolute',
			bottom: 0,
			width: '100%',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_10
		},
		typingLabel: {
			paddingHorizontal: size.s_14,
			paddingVertical: size.s_6,
			fontSize: size.s_14,
			color: colors.text
		},
		iconUserClan: {
			alignItems: 'center',
			justifyContent: 'center',
			display: 'flex',
			borderRadius: size.s_50,
			backgroundColor: Colors.tertiaryWeight,
			width: size.s_30,
			height: size.s_30
		},
		wrapperWelcomeMessage: {
			paddingHorizontal: size.s_10,
			marginVertical: size.s_30
		},
		wrapperCenter: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center'
		},
		channelView: {
			flex: 1,
			backgroundColor: colors.primary
		},
		iconWelcomeMessage: {
			backgroundColor: colors.primary,
			marginBottom: size.s_10,
			width: size.s_70,
			height: size.s_70,
			borderRadius: size.s_50,
			alignItems: 'center',
			justifyContent: 'center'
		},
		titleWelcomeMessage: {
			marginTop: size.s_10,
			fontSize: size.s_22,
			marginBottom: size.s_10,
			color: colors.textStrong,
			fontWeight: '600'
		},
		subTitleWelcomeMessage: {
			fontSize: size.s_12,
			color: colors.text,
			marginBottom: size.s_10
		},
		subTitleWelcomeMessageCenter: {
			fontSize: size.s_12,
			color: colors.text,
			marginBottom: size.s_10,
			textAlign: 'center'
		},
		subTitleUsername: {
			fontSize: size.s_18,
			color: colors.text,
			marginBottom: size.s_10
		},

		subTitleWelcomeMessageWithHighlight: {
			fontSize: size.s_12,
			color: baseColor.blurple,
			fontWeight: 'bold',
			marginBottom: size.s_10
		},
		wrapperAttachmentPreview: {
			backgroundColor: Colors.secondary,
			borderTopColor: Colors.gray48,
			paddingVertical: size.s_10
		},
		fileViewer: {
			gap: size.s_6,
			marginTop: size.s_6,
			paddingHorizontal: size.s_10,
			width: '80%',
			minHeight: verticalScale(50),
			alignItems: 'center',
			borderRadius: size.s_6,
			flexDirection: 'row',
			backgroundColor: Colors.bgPrimary
		},
		fileName: {
			fontSize: size.small,
			color: Colors.white
		},
		typeFile: {
			fontSize: size.small,
			color: Colors.textGray,
			textTransform: 'uppercase'
		},
		logoUser: {
			width: '100%',
			height: '100%'
		},
		wrapperAvatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden'
		},
		wrapperAvatarCombine: {
			width: size.s_40
		},
		btnScrollDown: {
			position: 'absolute',
			right: size.s_10,
			bottom: size.s_20,
			backgroundColor: colors.primary,
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_50,
			justifyContent: 'center',
			alignItems: 'center',
			shadowColor: Colors.black,
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.3,
			shadowRadius: 4.65,
			elevation: 8,
			zIndex: 1000
		},
		wrapperFooterImagesModal: {
			flex: 1,
			alignSelf: 'center',
			alignItems: 'center',
			width: width,
			paddingBottom: verticalScale(60),
			paddingTop: verticalScale(20),
			backgroundColor: Colors.secondary
		},
		footerImagesModal: {
			maxWidth: '70%'
		},
		imageFooterModal: {
			width: horizontalScale(40),
			height: verticalScale(50),
			marginHorizontal: horizontalScale(5),
			borderRadius: horizontalScale(5),
			borderWidth: 1,
			borderColor: Colors.tertiaryWeight
		},
		imageFooterModalActive: {
			width: horizontalScale(80),
			height: verticalScale(50),
			borderWidth: 1,
			borderColor: Colors.bgViolet
		},
		headerImagesModal: {
			padding: size.s_10,
			position: 'absolute',
			zIndex: 1000,
			top: Platform.OS === 'ios' ? size.s_40 : size.s_20,
			right: size.s_10,
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_50,
			backgroundColor: 'rgba(0,0,0,0.5)'
		},
		wrapperPlusClan: {
			marginTop: verticalScale(5),
			height: verticalScale(50),
			width: verticalScale(50),
			borderRadius: 50,
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: Colors.secondaryLight
		},
		overlay: {
			position: 'absolute',
			alignItems: 'center',
			justifyContent: 'center',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(000,000,000,0.8)'
		},
		channelContainer: { flexDirection: 'row', alignItems: 'center' },
		threadHeaderBox: { flexDirection: 'row', alignItems: 'center' },
		threadHeaderLabel: {
			color: colors.textStrong,
			fontWeight: '700',
			marginLeft: size.s_8,
			fontSize: size.label,
			width: '85%'
		},
		channelHeaderLabel: {
			color: colors.textStrong,
			marginLeft: size.s_8,
			fontSize: size.medium,
			maxWidth: '85%'
		},
		mb_10: {
			marginBottom: verticalScale(10)
		},
		aboveMessageDeleteReply: {
			flexDirection: 'row',
			paddingLeft: size.s_10,
			gap: size.s_4,
			marginTop: size.s_6,
			alignItems: 'center'
		},
		iconMessageDeleteReply: {
			backgroundColor: Colors.bgCharcoal,
			width: size.s_20,
			height: size.s_20,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			paddingRight: size.s_6,
			borderRadius: size.s_50,
			marginLeft: size.s_6
		},
		messageDeleteReplyText: {
			fontSize: size.small,
			color: Colors.tertiary,
			overflow: 'hidden',
			width: '80%',
			fontStyle: 'italic'
		},
		badge: {
			backgroundColor: Colors.red,
			position: 'absolute',
			borderRadius: size.s_14,
			borderWidth: 3,
			borderColor: Colors.secondary,
			minWidth: size.s_22,
			height: size.s_22,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -3,
			right: -5
		},
		badgeText: {
			color: Colors.white,
			fontWeight: 'bold',
			fontSize: size.small
		},
		inviteIconWrapper: {
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_50,
			backgroundColor: Colors.tertiaryWeight,
			width: size.s_40,
			height: size.s_40
		},
		sortButton: {
			paddingHorizontal: size.s_14,
			paddingVertical: size.s_6
		},
		iconBell: {
			paddingRight: size.s_14
		},
		friendActions: {
			flexDirection: 'row',
			gap: size.s_10
		},
		addFriendButton: {
			backgroundColor: Colors.green,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16
		},
		deleteFriendButton: {
			backgroundColor: Colors.vividScarlet,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16
		},
		blockButton: {
			backgroundColor: colors.channelNormal,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16
		},
		buttonText: {
			fontSize: size.s_14,
			color: Colors.white
		},
		containerDrawerEmpty: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center'
		},
		wall: {
			height: '100%',
			width: size.s_4
		},
		container: {
			flex: 1
		},
		rowContainer: {
			flex: 1,
			flexDirection: 'row'
		},
		messageText: {
			color: colors.text,
			fontSize: size.s_14
		},
		messageTime: { fontSize: size.s_10, color: colors.textDisabled },
		textMention: {
			fontSize: size.small,
			color: colors.textLink,
			backgroundColor: colors.midnightBlue,
			fontWeight: 'bold'
		},
		textPinMessage: {
			fontSize: size.small,
			color: colors.white,
			fontWeight: '700'
		},
		messageSystemBox: {
			marginLeft: size.s_20,
			justifyContent: 'space-between',
			width: '90%'
		}
	});
