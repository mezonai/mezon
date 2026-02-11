import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.primary
		},
		header: {
			flexShrink: 1,
			flexDirection: 'row',
			alignItems: 'stretch',
			justifyContent: 'space-between',
			paddingBottom: size.s_20,
			borderBottomWidth: 1,
			borderBottomColor: theme.border
		},
		backButton: {
			justifyContent: 'center',
			paddingHorizontal: size.s_14,
			width: size.s_50
		},
		headerTitleContainer: {
			flex: 1,
			alignItems: 'center',
			paddingHorizontal: size.s_16
		},
		headerSubtitle: {
			fontSize: size.s_12,
			fontWeight: '700',
			color: baseColor.blurple,
			letterSpacing: 1.5,
			marginBottom: size.s_4
		},
		headerTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: theme.textStrong,
			marginBottom: size.s_4
		},
		headerDescription: {
			fontSize: size.s_13,
			color: theme.text,
			opacity: 0.7
		},
		headerRight: {
			justifyContent: 'center',
			width: size.s_50,
			paddingHorizontal: size.s_14
		},
		scrollView: {
			flex: 1
		},
		scrollContent: {
			paddingVertical: size.s_24,
			paddingHorizontal: size.s_20
		},
		timelineContainer: {
			position: 'relative',
			paddingBottom: size.s_40
		},
		timelineLine: {
			position: 'absolute',
			left: '50%',
			top: 0,
			bottom: 0,
			width: 2,
			backgroundColor: baseColor.blurple,
			marginLeft: -1
		},
		timelineLineSegment: {
			position: 'absolute',
			left: '50%',
			top: 0,
			bottom: -size.s_40,
			width: 2,
			backgroundColor: baseColor.blurple,
			marginLeft: -1
		},
		timelineItemWrapper: {
			position: 'relative',
			marginBottom: size.s_40,
			minHeight: 100
		},
		timelineDot: {
			position: 'absolute',
			left: '50%',
			top: size.s_30,
			width: 12,
			height: 12,
			borderRadius: 6,
			backgroundColor: baseColor.blurple,
			marginLeft: -6,
			zIndex: 2
		},
		timelineDate: {
			position: 'absolute',
			top: size.s_6,
			alignItems: 'center',
			minWidth: 50
		},
		timelineDateLeft: {
			right: '50%',
			marginRight: size.s_20
		},
		timelineDateRight: {
			left: '50%',
			marginLeft: size.s_20
		},
		dateMonth: {
			fontSize: size.s_12,
			fontWeight: '600',
			color: theme.text,
			opacity: 0.6,
			letterSpacing: 0.5
		},
		dateDay: {
			fontSize: size.s_32,
			fontWeight: '700',
			color: baseColor.blurple,
			lineHeight: 38
		},
		dateYear: {
			fontSize: size.s_12,
			fontWeight: '500',
			color: theme.text,
			opacity: 0.5
		},
		eventCardContainer: {
			position: 'relative',
			paddingTop: size.s_30
		},
		eventCardLeft: {
			paddingRight: '50%',
			paddingLeft: 0,
			marginRight: size.s_20
		},
		eventCardRight: {
			paddingLeft: '50%',
			paddingRight: 0,
			marginLeft: size.s_20
		},
		eventCard: {
			backgroundColor: theme.secondary,
			borderRadius: size.s_16,
			padding: size.s_16,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2
			},
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 3
		},
		eventTitle: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: theme.textStrong,
			marginBottom: size.s_6
		},
		eventDescription: {
			fontSize: size.s_14,
			color: theme.text,
			lineHeight: 20,
			marginBottom: size.s_12
		},
		eventImages: {
			marginTop: size.s_8
		},
		albumGrid: {
			flexDirection: 'row',
			gap: size.s_8,
			flexWrap: 'wrap'
		},
		albumImage: {
			width: 50,
			height: 50,
			borderRadius: size.s_8
		},
		singleImage: {
			width: '100%',
			height: 120,
			borderRadius: size.s_12
		},
		fab: {
			position: 'absolute',
			bottom: size.s_32,
			right: size.s_24,
			width: 64,
			height: 64,
			borderRadius: 32,
			backgroundColor: baseColor.blurple,
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: baseColor.blurple,
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.4,
			shadowRadius: 12,
			elevation: 8
		},
		viewAlbumButton: {
			marginTop: size.s_12,
			alignSelf: 'flex-start'
		},
		viewAlbumText: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: baseColor.blurple
		},
		// Full-width event styles
		timelineItemWrapperFull: {
			minHeight: 200
		},
		eventCardFull: {
			paddingLeft: 0,
			paddingRight: 0,
			paddingTop: size.s_50
		},
		eventCardFullWidth: {
			padding: size.s_20,
			borderWidth: 1,
			borderColor: baseColor.blurple,
			position: 'relative'
		},
		eventCardSpecial: {
			backgroundColor: '#2a2a4a',
			borderColor: '#FDD835'
		},
		fullWidthDateBadge: {
			position: 'absolute',
			top: size.s_12,
			right: size.s_12,
			backgroundColor: baseColor.blurple,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8,
			borderRadius: size.s_8,
			alignItems: 'center'
		},
		fullWidthDateMonth: {
			fontSize: size.s_10,
			fontWeight: '600',
			color: 'white',
			letterSpacing: 0.5
		},
		fullWidthDateDay: {
			fontSize: size.s_24,
			fontWeight: '700',
			color: 'white',
			lineHeight: 28
		},
		fullWidthDateYear: {
			fontSize: size.s_10,
			fontWeight: '500',
			color: 'white',
			opacity: 0.8
		},
		specialBadge: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4,
			backgroundColor: 'rgba(253, 213, 53, 0.2)',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_4,
			borderRadius: size.s_6,
			alignSelf: 'flex-start',
			marginBottom: size.s_8
		},
		specialBadgeText: {
			fontSize: size.s_10,
			fontWeight: '700',
			color: '#FDD835',
			letterSpacing: 0.5
		},
		albumGridFull: {
			flexWrap: 'wrap'
		},
		singleImageFull: {
			height: 200
		},
		emptyContainer: {
			flex: 1,
			alignItems: 'center',
			paddingTop: size.s_100,
			paddingHorizontal: size.s_32
		},
		emptyTitle: {
			fontSize: size.s_20, // size.s_18 in styles, but screenshot looks large
			fontWeight: '700',
			color: theme.textStrong,
			marginTop: size.s_32,
			textAlign: 'center'
		},
		emptyDescription: {
			fontSize: size.s_16,
			color: theme.text,
			textAlign: 'center',
			marginTop: size.s_8,
			marginBottom: size.s_32,
			lineHeight: 24,
			opacity: 0.7
		},
		createButton: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: '#8B5CF6', // Purple color from screenshot approx or baseColor.blurple
			paddingVertical: size.s_12,
			paddingHorizontal: size.s_24,
			borderRadius: size.s_50, // pill shape
			gap: size.s_8,
			shadowColor: '#8B5CF6',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 4
		},
		createButtonText: {
			color: 'white',
			fontSize: size.s_16,
			fontWeight: '600'
		},
		emptyImage: {
			width: 200,
			height: 200
		}
	});
