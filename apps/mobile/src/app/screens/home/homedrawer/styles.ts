import type { Attributes } from '@mezon/mobile-ui';
import { Fonts, Metrics, baseColor, horizontalScale, size, verticalScale } from '@mezon/mobile-ui';
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
			color: '#2a2e31',
			backgroundColor: 'white',
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
			backgroundColor: colors.secondary
		},
		homeDefault: {
			backgroundColor: colors.primary,
			flex: 1,
			zIndex: 10000
		},
		wrapperChannelMessage: {
			flex: 1,
			justifyContent: 'space-between'
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
			color: colors.tertiary,
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
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10,
			borderWidth: 0.4,
			borderColor: baseColor.gray
		},
		channelListItemTitle: {
			fontSize: size.s_14,
			fontWeight: '600',
			marginLeft: size.s_6,
			color: colors.tertiary
		},
		channelListItemTitleActive: {
			color: 'white'
		},
		channelDotWrapper: {
			backgroundColor: baseColor.redStrong,
			height: size.s_10,
			width: size.s_10,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_10
		},
		channelDot: {
			color: 'white',
			fontSize: Fonts.size.h8
		},
		dotIsNew: {
			position: 'absolute',
			left: -size.s_10,
			width: size.s_6,
			height: size.s_6,
			borderRadius: size.s_6,
			backgroundColor: 'white'
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
			backgroundColor: colors.tertiary,
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
			backgroundColor: colors.tertiary,
			borderWidth: 1,
			borderColor: colors.borderDim
		},
		logoClan: {
			height: verticalScale(70),
			width: verticalScale(70),
			resizeMode: 'cover'
		},
		textLogoClanIcon: {
			color: colors.textDisabled,
			fontSize: size.s_22,
			fontWeight: '600'
		},
		homeDefaultHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			paddingRight: size.s_14,
			paddingBottom: size.s_4
		},
		lineActiveClan: {
			backgroundColor: baseColor.azureBlue,
			width: size.s_4,
			height: '80%',
			top: '10%',
			left: -size.s_13,
			borderTopRightRadius: size.s_10,
			borderBottomEndRadius: size.s_10,
			position: 'absolute'
		},
		clanIconActive: {
			backgroundColor: 'black',
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
			color: colors.tertiary,
			top: size.s_6
		},
		iconBar: {
			paddingRight: size.s_14,
			height: '100%',
			paddingTop: size.s_10,
			paddingBottom: size.s_12,
			paddingLeft: size.s_14
		},
		wrapperServerList: {
			height: '100%',
			paddingTop: size.s_20,
			width: '22%',
			justifyContent: 'flex-start',
			backgroundColor: colors.primary,
			alignItems: 'center',
			gap: size.s_10
		},
		friendItemWrapper: {
			marginHorizontal: size.s_20,
			paddingVertical: size.s_10,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		friendItemWrapperInvited: {
			opacity: 0.6
		},
		friendItemContent: {
			flexDirection: 'row',
			maxWidth: '70%'
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
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10,
			borderWidth: 0.4,
			borderColor: baseColor.gray,
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
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10,
			borderWidth: 0.4,
			borderColor: baseColor.gray
		},
		wrapperMessageBox: {
			flexDirection: 'row',
			paddingLeft: size.s_6,
			paddingRight: size.s_28
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
			backgroundColor: baseColor.gray,
			overflow: 'hidden'
		},
		messageWrapper: {
			flexDirection: 'column',
			marginTop: size.s_10,
			paddingTop: size.s_2,
			borderLeftWidth: 2,
			borderLeftColor: 'transparent',
			// paddingTop: 50,
			// paddingBottom: 50
			marginBottom: size.s_6
		},
		highlightMessageMention: {
			borderLeftColor: colors.textLink,
			borderLeftWidth: 2,
			paddingTop: size.s_2,
			backgroundColor: colors.reactionBg
		},
		highlightMessageReply: {
			backgroundColor: 'rgba(201,157,7,0.1)',
			borderLeftColor: '#F0B132',
			borderLeftWidth: 2,
			paddingVertical: size.s_2
		},
		repliedTextAvatar: {
			fontSize: size.s_12,
			color: 'white'
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
			color: baseColor.caribbeanGreen,
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
		usernameMessageBox: {
			fontSize: size.medium,
			marginRight: size.s_10,
			fontWeight: '700',
			color: baseColor.caribbeanGreen
		},
		dateMessageBox: {
			fontSize: size.small,
			color: baseColor.gray
		},
		contentMessageCombine: {
			padding: size.s_2
		},
		contentMessageLink: {
			fontSize: size.medium,
			color: baseColor.link,
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
			backgroundColor: colors.text,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatarMessageBoxDefault: {
			fontSize: size.s_22,
			color: 'white'
		},
		imageMessageRender: {
			borderRadius: verticalScale(5),
			marginVertical: size.s_6,
			borderWidth: 0.5,
			borderColor: colors.border
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
			backgroundColor: colors.tertiary,
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
		groupAvatar: {
			backgroundColor: baseColor.orange,
			width: size.s_50,
			height: size.s_50,
			borderRadius: 50,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden'
		},
		groupAvatarWrapper: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20,
			overflow: 'hidden'
		},
		defaultAvatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20
		},
		channelView: {
			flex: 1
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
			backgroundColor: colors.secondary,
			borderTopColor: baseColor.gray,
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
			backgroundColor: colors.primary
		},
		fileName: {
			fontSize: size.small,
			color: 'white'
		},
		typeFile: {
			fontSize: size.small,
			color: baseColor.gray,
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
			bottom: size.s_28,
			backgroundColor: colors.secondary,
			borderColor: colors.textDisabled,
			borderWidth: 1,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			justifyContent: 'center',
			alignItems: 'center'
		},
		wrapperFooterImagesModal: {
			flex: 1,
			alignSelf: 'center',
			alignItems: 'center',
			width,
			paddingBottom: verticalScale(60),
			paddingTop: verticalScale(20),
			backgroundColor: colors.secondary
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
			borderColor: colors.tertiary
		},
		imageFooterModalActive: {
			width: horizontalScale(80),
			height: verticalScale(50),
			borderWidth: 1,
			borderColor: colors.bgViolet
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
			backgroundColor: colors.secondaryLight
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
			backgroundColor: '#313338',
			width: size.s_20,
			height: size.s_20,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_50,
			marginLeft: size.s_6
		},
		messageDeleteReplyText: {
			fontSize: size.small,
			color: colors.text,
			overflow: 'hidden',
			width: '80%',
			fontStyle: 'italic'
		},
		badge: {
			backgroundColor: baseColor.redStrong,
			position: 'absolute',
			borderRadius: size.s_14,
			borderWidth: 3,
			borderColor: colors.secondary,
			minWidth: size.s_22,
			height: size.s_22,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -3,
			right: -5
		},
		badgeText: {
			color: 'white',
			fontWeight: 'bold',
			fontSize: size.small
		},
		inviteIconWrapper: {
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_50,
			backgroundColor: colors.tertiary,
			width: size.s_40,
			height: size.s_40
		},
		sortButton: {
			paddingHorizontal: size.s_14,
			paddingVertical: size.s_6
		},
		iconBell: {
			paddingRight: size.s_14,
			padding: 0
		},
		friendActions: {
			flexDirection: 'row',
			gap: size.s_10
		},
		addFriendButton: {
			backgroundColor: baseColor.green,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16
		},
		deleteFriendButton: {
			backgroundColor: baseColor.redStrong,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16
		},
		blockButton: {
			backgroundColor: baseColor.redStrong,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16
		},
		buttonText: {
			fontSize: size.s_14,
			color: 'white'
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
		forward: {
			fontSize: size.s_12,
			color: baseColor.gray,
			fontStyle: 'italic'
		},
		messageTime: { fontSize: size.s_10, color: colors.textDisabled },
		textMention: {
			fontSize: size.medium,
			color: colors.textLink,
			backgroundColor: colors.midnightBlue,
			fontWeight: '600'
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
		},
		albumButton: {
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			flex: 1,
			paddingTop: size.s_10,
			width: '100%',
			padding: size.s_8
		},
		albumButtonGroup: {
			flexDirection: 'row',
			gap: size.s_4,
			alignItems: 'center'
		},
		albumTitle: {
			color: colors.textStrong,
			fontWeight: 'bold'
		},
		albumPanel: {
			position: 'absolute',
			backgroundColor: colors.secondaryLight,
			top: size.s_70,
			left: '25%',
			right: '25%',
			zIndex: 2,
			overflow: 'hidden',
			maxHeight: Dimensions.get('window').height * 0.7,
			paddingVertical: size.s_4,
			borderRadius: size.s_16
		},
		albumItem: {
			paddingVertical: size.s_4,
			flexDirection: 'row',
			alignItems: 'center',
			marginHorizontal: size.s_8,
			backgroundColor: colors.secondaryLight
		},
		albumCoverImage: {
			height: size.s_40,
			width: size.s_40,
			borderRadius: size.s_8
		},
		albumTitleAndCount: {
			gap: size.s_10,
			justifyContent: 'flex-start',
			marginLeft: size.s_10,
			width: '55%'
		},
		albumImageCount: {
			fontSize: size.s_12,
			color: colors.text,
			fontWeight: '600'
		},
		albumSeperatedItem: {
			height: 1,
			backgroundColor: colors.border
		},
		albumSelectedIcon: {
			position: 'absolute',
			right: size.s_10,
			height: '100%',
			justifyContent: 'center',
			bottom: size.s_6
		},
		channelAppButton: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			paddingVertical: size.s_10,
			marginBottom: size.s_6,
			borderRadius: size.s_10
		},
		wrapperTextAvatar: {
			width: size.s_100,
			height: size.s_100,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.colorAvatarDefault,
			borderRadius: size.s_50
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h1,
			color: 'white'
		},
		ephemeralMessage: {
			backgroundColor: `${baseColor.blurple}1A`,
			borderLeftWidth: size.s_4,
			borderColor: baseColor.blurple,
			borderRadius: size.s_6
		},
		ephemeralIndicator: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: size.s_4
		},
		ephemeralText: {
			fontSize: size.s_12,
			color: colors.textDisabled,
			fontStyle: 'italic',
			marginLeft: size.s_4
		},
		replyMessage: {
			borderRadius: size.s_40,
			width: size.s_40,
			marginHorizontal: size.s_20,
			paddingVertical: size.s_2,
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.bgViolet
		},
		cardMsg: {
			padding: size.s_10,
			paddingTop: size.s_6,
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: size.s_8
		},
		headerTouchable: {
			flex: 1
		},
		headerRowContainer: {
			flexDirection: 'row',
			alignItems: 'center'
		},
		headerTooltipContainer: {
			position: 'relative',
			zIndex: 0
		},
		messageWrapperCombine: {
			marginTop: 0
		},
		rowMessageBoxFullWidth: {
			width: '100%'
		},
		forwardBorder: {
			display: 'flex',
			borderLeftWidth: 2,
			borderColor: 'gray',
			paddingLeft: 10
		},
		userNameFullWidth: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			width: '90%'
		},
		marginLeft30: {
			marginLeft: size.s_30,
			marginRight: -size.s_4
		},
		heightAuto: {
			height: size.s_50
		},
		paddingVertical20: {
			paddingVertical: 20
		},
		errorTextColor: {
			color: baseColor.redStrong
		},
		absoluteFill: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		},
		flexOne: {
			flex: 1
		},
		imageFull: {
			width: '100%',
			height: '100%'
		},
		flexRow: {
			flexDirection: 'row'
		},
		addFriendButtonOpacity: {
			opacity: 0.6
		},
		textAlignCenter: {
			textAlign: 'center'
		},
		spacerHeight8: {
			height: size.s_8
		},
		columnFlexDirection: {
			flexDirection: 'column'
		},
		systemMessageContainer: {
			marginVertical: size.s_10,
			paddingLeft: 0
		},
		pressedMessageIOS: (secondaryWeight: string) => ({
			backgroundColor: secondaryWeight,
			opacity: 0.8
		}),
		contentDisplay: {
			display: 'flex'
		},
		opacityErrorRetry: {
			opacity: 0.6
		},
		opacityNormal: {
			opacity: 1
		},
		channelAppHotbarContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_10,
			gap: size.s_10,
			backgroundColor: 'transparent'
		},
		channelMessagesWrapperContainer: {
			flex: 1
		}
	});
