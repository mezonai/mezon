import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_16,
			paddingBottom: size.s_16
		},
		headerTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: theme.text
		},
		scrollView: {
			flex: 1,
			paddingHorizontal: size.s_16
		},
		yearFilterContainer: {
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_16,
			gap: size.s_8
		},
		yearFilterScroll: {
			flexDirection: 'row',
			gap: size.s_8
		},
		yearChip: {
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_8,
			borderRadius: size.s_20,
			borderWidth: 1,
			borderColor: '#8B5CF6'
		},
		yearChipSelected: {
			backgroundColor: '#8B5CF6',
			borderColor: '#8B5CF6'
		},
		yearChipText: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: '#9999bb'
		},
		yearChipTextSelected: {
			color: 'white'
		},
		eventsSection: {
			marginTop: size.s_24
		},
		eventsSectionHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			marginBottom: size.s_16
		},
		eventsSectionTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: 'white'
		},
		heritageFeedButton: {
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_6,
			borderWidth: 1,
			borderColor: '#8B5CF6'
		},
		heritageFeedText: {
			fontSize: size.s_12,
			fontWeight: '700',
			color: '#8B5CF6',
			letterSpacing: 0.5
		},
		eventCard: {
			backgroundColor: '#2a2a4a',
			borderRadius: size.s_16,
			marginBottom: size.s_16,
			overflow: 'hidden'
		},
		eventImageContainer: {
			width: '100%',
			height: 180,
			position: 'relative'
		},
		eventImage: {
			width: '100%',
			height: '100%'
		},
		eventCategoryBadge: {
			position: 'absolute',
			top: size.s_12,
			right: size.s_12,
			backgroundColor: '#8B5CF6',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_6
		},
		eventCategoryText: {
			fontSize: size.s_12,
			fontWeight: '700',
			color: 'white',
			letterSpacing: 0.5
		},
		eventContent: {
			padding: size.s_16
		},
		eventTitle: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: 'white',
			marginBottom: size.s_10
		},
		eventDateTime: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: size.s_10,
			gap: size.s_8
		},
		eventDateTimeText: {
			fontSize: size.s_14,
			color: '#9999bb',
			flex: 1
		},
		daysUntilBadge: {
			backgroundColor: '#8B5CF6',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_4,
			borderRadius: size.s_12
		},
		daysUntilText: {
			fontSize: size.s_12,
			fontWeight: '600',
			color: 'white'
		},
		eventDescription: {
			fontSize: size.s_14,
			color: '#ccccdd',
			lineHeight: 20,
			marginBottom: size.s_16,
			fontStyle: 'italic'
		},
		eventActions: {
			flexDirection: 'row',
			gap: size.s_12
		},
		addToGalleryButton: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#8B5CF6',
			paddingVertical: size.s_12,
			borderRadius: size.s_24,
			gap: size.s_8
		},
		addToGalleryText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: 'white'
		},
		shareButton: {
			width: 48,
			height: 48,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#8B5CF6',
			borderRadius: 24
		},
		bottomSpacer: {
			height: 100
		},
		fab: {
			position: 'absolute',
			bottom: size.s_32,
			right: size.s_16,
			width: 64,
			height: 64,
			borderRadius: 32,
			backgroundColor: '#8B5CF6',
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#8B5CF6',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.4,
			shadowRadius: 12,
			elevation: 8
		}
	});
