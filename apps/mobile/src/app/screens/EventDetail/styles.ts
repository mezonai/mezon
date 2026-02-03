import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.primary
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_16,
			paddingTop: size.s_50,
			paddingBottom: size.s_20,
			backgroundColor: '#8B5CF6',
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: 0
		},
		headerButton: {
			padding: size.s_4,
			zIndex: 2
		},
		headerContent: {
			flex: 1,
			paddingHorizontal: size.s_16,
			alignItems: 'center'
		},
		headerTitle: {
			fontSize: size.s_24,
			fontWeight: '700',
			color: 'white',
			marginBottom: size.s_6,
			textAlign: 'center'
		},
		dateContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		headerDate: {
			fontSize: size.s_14,
			color: 'white',
			opacity: 0.9
		},
		scrollView: {
			flex: 1
		},
		featuredImageContainer: {
			width: '100%',
			height: 320,
			position: 'relative',
			backgroundColor: theme.secondary
		},
		featuredImage: {
			width: '100%',
			height: '100%'
		},
		featuredBadge: {
			position: 'absolute',
			bottom: size.s_16,
			right: size.s_16,
			backgroundColor: 'rgba(255, 255, 255, 0.9)',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_6
		},
		featuredBadgeText: {
			fontSize: size.s_11,
			fontWeight: '700',
			color: '#8B5CF6',
			letterSpacing: 0.5
		},
		featuredUploaderContainer: {
			position: 'absolute',
			bottom: size.s_16,
			left: size.s_16,
			width: 40,
			height: 40,
			borderRadius: 20,
			borderWidth: 1,
			borderColor: 'white',
			overflow: 'hidden',
			backgroundColor: theme.secondary,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2
			},
			shadowOpacity: 0.3,
			shadowRadius: 4,
			elevation: 4
		},
		featuredUploaderAvatar: {
			width: '100%',
			height: '100%'
		},
		gridContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			padding: size.s_8
		},
		gridItem: {
			width: '50%',
			aspectRatio: 1,
			padding: size.s_8,
			position: 'relative'
		},
		gridImage: {
			width: '100%',
			height: '100%',
			borderRadius: size.s_16,
			backgroundColor: theme.secondary
		},
		uploaderAvatarContainer: {
			position: 'absolute',
			bottom: size.s_16,
			right: size.s_16,
			width: 32,
			height: 32,
			borderRadius: 16,
			borderWidth: 1,
			borderColor: 'white',
			overflow: 'hidden',
			backgroundColor: theme.secondary
		},
		uploaderAvatar: {
			width: '100%',
			height: '100%'
		},
		uploadPlaceholder: {
			width: '50%',
			aspectRatio: 1,
			padding: size.s_8
		},
		uploadIconContainer: {
			flex: 1,
			borderRadius: size.s_16,
			borderWidth: 1,
			borderColor: '#8B5CF6',
			borderStyle: 'dashed',
			backgroundColor: 'rgba(139, 92, 246, 0.05)',
			alignItems: 'center',
			justifyContent: 'center'
		},
		bottomSpacer: {
			height: 100
		},
		fab: {
			position: 'absolute',
			bottom: size.s_32,
			right: size.s_24,
			width: 60,
			height: 60,
			borderRadius: 30,
			backgroundColor: '#8B5CF6',
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 8
		}
	});
