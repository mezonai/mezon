import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		reactionWrapper: {
			paddingTop: size.s_6,
			flexDirection: 'row',
			gap: size.s_6,
			flexWrap: 'wrap',
			alignItems: 'center'
		},
		reactionSpace: {
			marginBottom: size.s_2
		},
		myReaction: {
			borderWidth: 1,
			backgroundColor: colors.reactionBg,
			borderColor: colors.reactionBorder
		},
		otherReaction: {
			backgroundColor: colors.secondary
		},
		reactItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_2,
			padding: size.s_2,
			borderRadius: 5,
			height: size.s_30
		},
		imageReactionTemp: {
			height: size.s_30,
			width: size.s_20 + size.s_2
		},
		reactCount: {
			color: colors.text,
			fontSize: size.small
		},
		bottomSheetWrapper: {
			flex: 1,
			backgroundColor: colors.secondary,
			width: '100%',
			borderTopRightRadius: 8,
			borderTopLeftRadius: 8
		},
		tabHeaderWrapper: {
			width: '100%',
			flexDirection: 'row'
		},
		contentHeader: {
			width: '100%',
			padding: size.s_10,
			borderBottomWidth: 2,
			borderBottomColor: colors.border,
			backgroundColor: colors.primary,
			height: size.s_60
		},
		tabHeaderItem: {
			padding: size.s_4,
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4,
			borderRadius: 8,
			marginRight: 7
		},
		activeTab: {
			backgroundColor: colors.border
		},
		originEmojiColor: {
			color: Colors.white
		},
		emojiTab: {
			fontSize: size.input
		},
		headerTabCount: {
			fontSize: size.label
		},
		contentWrapper: {
			padding: size.s_12,
			gap: size.s_10
		},
		avatarBoxDefault: {
			width: '100%',
			height: '100%',
			borderRadius: size.s_50,
			backgroundColor: Colors.titleReset,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatarBoxDefault: {
			fontSize: size.s_22,
			color: Colors.white
		},
		memberWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},
		imageWrapper: {
			width: size.s_36,
			height: size.s_36,
			borderRadius: size.s_36,
			overflow: 'hidden',
			backgroundColor: Colors.bgGrayDark
		},
		image: {
			width: '100%',
			height: '100%'
		},
		memberName: {
			marginLeft: size.s_12,
			color: colors.white
		},
		mentionText: {
			color: Colors.bgGrayDark
		},
		addEmojiIcon: {
			width: size.s_18,
			height: size.s_18
		},
		iconEmojiReaction: {
			width: size.s_18,
			height: size.s_18,
			marginRight: size.s_2
		},
		iconEmojiReactionDetail: {
			width: size.s_24,
			height: size.s_24,
			padding: size.s_2
		},
		removeEmojiContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		confirmDeleteEmoji: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: Colors.red,
			paddingVertical: size.s_8,
			paddingHorizontal: size.s_14,
			gap: size.s_6,
			borderRadius: 50
		},
		confirmText: {
			color: Colors.white,
			fontSize: size.label
		},
		emojiText: {
			color: colors.text,
			fontSize: size.label
		},
		noActionsWrapper: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		noActionTitle: {
			color: Colors.white,
			fontSize: size.h6
		},
		noActionContent: {
			color: Colors.textGray,
			fontSize: size.medium
		}
	});
