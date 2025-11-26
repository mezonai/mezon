import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
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
		memberReactContainer: {
			flexDirection: 'column',
			gap: size.s_6
		},
		memberReactCount: {
			marginLeft: size.s_12,
			color: colors.textDisabled,
			fontSize: size.small,
			fontWeight: 'bold'
		},
		reactCount: {
			fontWeight: '600',
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
			gap: size.s_6,
			borderRadius: 8,
			marginRight: 7
		},
		activeTab: {
			backgroundColor: colors.secondary
		},
		originEmojiColor: {
			color: 'white'
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
		memberWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6,
			backgroundColor: colors.primary
		},
		imageWrapper: {
			width: size.s_36,
			height: size.s_36,
			borderRadius: size.s_36,
			overflow: 'hidden'
		},
		memberName: {
			fontWeight: '600',
			marginLeft: size.s_12,
			color: colors.text
		},
		mentionText: {
			color: '#676b73'
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
		deleteEmojiWrapper: {
			minHeight: size.s_36
		},
		confirmDeleteEmoji: {
			backgroundColor: baseColor.redStrong,
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: size.s_8,
			paddingVertical: size.s_8,
			borderRadius: size.s_8,
			flexDirection: 'row',
			gap: size.s_6
		},
		emojiText: {
			color: colors.text,
			fontWeight: '600',
			fontSize: size.medium,
			flexShrink: 1
		},
		noActionsWrapper: {
			flex: 1,
			paddingTop: size.s_20,
			justifyContent: 'center',
			alignItems: 'center'
		},
		noActionTitle: {
			textAlign: 'center',
			fontWeight: '600',
			color: colors.textStrong,
			marginBottom: size.s_4,
			fontSize: size.h4
		},
		noActionContent: {
			textAlign: 'center',
			color: colors.text,
			fontSize: size.medium
		},
		reactionListItem: {
			marginBottom: size.s_10
		},
		deleteSwipeButton: {
			backgroundColor: baseColor.redStrong,
			alignItems: 'center',
			justifyContent: 'center',
			paddingHorizontal: size.s_8,
			borderRadius: size.s_8,
			flexDirection: 'row',
			gap: size.s_6
		},
		deleteSwipeText: {
			color: baseColor.white,
			fontSize: size.s_14,
			fontWeight: '600'
		}
	});
