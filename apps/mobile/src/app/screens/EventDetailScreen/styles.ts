import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: '#1a1a2e'
		},
		scrollView: {
			flex: 1
		},
		heroContainer: {
			height: 320,
			position: 'relative'
		},
		heroImage: {
			width: '100%',
			height: '100%'
		},
		headerOverlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingTop: size.s_50,
			paddingHorizontal: size.s_16,
			paddingBottom: size.s_16,
			backgroundColor: 'rgba(0, 0, 0, 0.3)'
		},
		headerButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: 'rgba(255, 255, 255, 0.2)',
			alignItems: 'center',
			justifyContent: 'center'
		},
		headerRight: {
			flexDirection: 'row',
			gap: size.s_12
		},
		categoryBadge: {
			position: 'absolute',
			top: size.s_100,
			left: size.s_16,
			backgroundColor: '#8B5CF6',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_6
		},
		categoryText: {
			fontSize: size.s_11,
			fontWeight: '700',
			color: 'white',
			letterSpacing: 0.5
		},
		titleOverlay: {
			position: 'absolute',
			bottom: 0,
			left: 0,
			right: 0,
			padding: size.s_20,
			paddingTop: size.s_40,
			background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.8))',
			backgroundColor: 'rgba(0, 0, 0, 0.6)'
		},
		eventTitle: {
			fontSize: size.s_28,
			fontWeight: '700',
			color: 'white',
			marginBottom: size.s_8
		},
		dateTimeRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		dateTimeText: {
			fontSize: size.s_14,
			color: 'white',
			opacity: 0.9
		},
		content: {
			padding: size.s_20
		},
		actionButtons: {
			flexDirection: 'row',
			gap: size.s_12,
			marginBottom: size.s_24
		},
		goingButton: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#8B5CF6',
			paddingVertical: size.s_14,
			borderRadius: size.s_24,
			gap: size.s_8
		},
		goingButtonActive: {
			backgroundColor: '#7C3AED'
		},
		goingButtonText: {
			fontSize: size.s_16,
			fontWeight: '700',
			color: 'white'
		},
		addPhotosButton: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#2a2a4a',
			paddingVertical: size.s_14,
			borderRadius: size.s_24,
			gap: size.s_8,
			borderWidth: 1,
			borderColor: '#8B5CF6'
		},
		addPhotosButtonText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: 'white'
		},
		infoSection: {
			flexDirection: 'row',
			marginBottom: size.s_24,
			gap: size.s_16
		},
		infoIconContainer: {
			width: 48,
			height: 48,
			borderRadius: 24,
			backgroundColor: '#2a2a4a',
			alignItems: 'center',
			justifyContent: 'center'
		},
		infoContent: {
			flex: 1
		},
		infoTitle: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: 'white',
			marginBottom: size.s_4
		},
		infoText: {
			fontSize: size.s_14,
			color: '#9999bb',
			marginBottom: size.s_8
		},
		addToCalendarText: {
			fontSize: size.s_12,
			fontWeight: '700',
			color: '#8B5CF6',
			letterSpacing: 0.5
		},
		mapPreview: {
			height: 150,
			backgroundColor: '#2a2a4a',
			borderRadius: size.s_12,
			marginTop: size.s_12,
			alignItems: 'center',
			justifyContent: 'center'
		},
		mapPreviewText: {
			fontSize: size.s_14,
			color: '#666680',
			marginTop: size.s_8
		},
		descriptionSection: {
			marginBottom: size.s_24
		},
		sectionTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: 'white',
			marginBottom: size.s_12
		},
		descriptionText: {
			fontSize: size.s_15,
			color: '#ccccdd',
			lineHeight: 24
		},
		guestSection: {
			marginBottom: size.s_24
		},
		guestHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: size.s_16,
			gap: size.s_12
		},
		guestCount: {
			fontSize: size.s_14,
			color: '#9999bb'
		},
		seeAllText: {
			fontSize: size.s_12,
			fontWeight: '700',
			color: '#8B5CF6',
			marginLeft: 'auto',
			letterSpacing: 0.5
		},
		guestAvatars: {
			flexDirection: 'row',
			gap: -size.s_8
		},
		guestAvatar: {
			width: 48,
			height: 48,
			borderRadius: 24,
			borderWidth: 3,
			borderColor: '#1a1a2e'
		},
		moreGuestsAvatar: {
			width: 48,
			height: 48,
			borderRadius: 24,
			backgroundColor: '#2a2a4a',
			borderWidth: 3,
			borderColor: '#1a1a2e',
			alignItems: 'center',
			justifyContent: 'center'
		},
		moreGuestsText: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: '#9999bb'
		},
		discussionSection: {
			backgroundColor: '#2a2a4a',
			borderRadius: size.s_16,
			padding: size.s_16
		},
		discussionHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: size.s_16,
			gap: size.s_8
		},
		discussionTitle: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: 'white',
			flex: 1
		},
		discussionBadge: {
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: '#8B5CF6',
			alignItems: 'center',
			justifyContent: 'center'
		},
		discussionBadgeText: {
			fontSize: size.s_12,
			fontWeight: '700',
			color: 'white'
		},
		discussionItem: {
			flexDirection: 'row',
			marginBottom: size.s_16,
			gap: size.s_12
		},
		discussionAvatar: {
			width: 40,
			height: 40,
			borderRadius: 20
		},
		discussionContent: {
			flex: 1
		},
		discussionAuthor: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: 'white',
			marginBottom: size.s_4
		},
		discussionMessage: {
			fontSize: size.s_14,
			color: '#ccccdd',
			lineHeight: 20
		},
		joinChatButton: {
			backgroundColor: '#3a3a5a',
			paddingVertical: size.s_14,
			borderRadius: size.s_24,
			alignItems: 'center',
			borderWidth: 1,
			borderColor: '#8B5CF6'
		},
		joinChatButtonText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: 'white'
		},
		bottomSpacer: {
			height: 40
		}
	});
