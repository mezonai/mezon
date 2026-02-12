import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: theme.primary,
			paddingTop: size.s_16
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_16,
			marginBottom: size.s_12
		},
		headerLeft: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8
		},
		headerTitle: {
			fontSize: size.s_14,
			fontWeight: '700',
			color: theme.textStrong,
			letterSpacing: 0.5
		},
		mediaGrid: {
			flexDirection: 'row',
			paddingHorizontal: size.s_16,
			gap: size.s_10,
			marginBottom: size.s_12
		},
		mainMedia: {
			flex: 2,
			height: 120,
			borderRadius: size.s_12,
			overflow: 'hidden',
			position: 'relative',
			backgroundColor: theme.secondary
		},
		mainMediaImage: {
			width: '100%',
			height: '100%'
		},
		latestBadge: {
			position: 'absolute',
			top: size.s_12,
			left: size.s_12,
			backgroundColor: '#8B5CF6',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_4,
			borderRadius: size.s_6
		},
		latestBadgeText: {
			color: 'white',
			fontSize: size.s_10,
			fontWeight: '700',
			letterSpacing: 0.5
		},
		mainMediaTitleContainer: {
			position: 'absolute',
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: 'rgba(0, 0, 0, 0.6)',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_10
		},
		mainMediaTitle: {
			color: 'white',
			fontSize: size.s_16,
			fontWeight: '700'
		},
		sideMedia: {
			flex: 1,
			gap: size.s_10
		},
		sideMediaItem: {
			flex: 1,
			borderRadius: size.s_12,
			overflow: 'hidden',
			position: 'relative',
			backgroundColor: theme.secondary
		},
		sideMediaItemSpacing: {
			// Additional spacing if needed
		},
		sideMediaImage: {
			width: '100%',
			height: '100%'
		},
		playIconContainer: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			transform: [{ translateX: -16 }, { translateY: -16 }],
			backgroundColor: 'rgba(0, 0, 0, 0.4)',
			borderRadius: 20,
			width: 40,
			height: 40,
			alignItems: 'center',
			justifyContent: 'center'
		},
		avatarsContainer: {
			marginBottom: size.s_16
		},
		avatarsContent: {
			paddingHorizontal: size.s_16,
			gap: size.s_16
		},
		avatarItem: {
			alignItems: 'center',
			marginRight: size.s_16,
			width: 70
		},
		avatarImageContainer: {
			width: 60,
			height: 60,
			borderRadius: 30,
			borderWidth: 3,
			borderColor: '#8B5CF6',
			padding: 2,
			marginBottom: size.s_6
		},
		avatarImage: {
			width: '100%',
			height: '100%',
			borderRadius: 28
		},
		avatarName: {
			color: theme.text,
			fontSize: size.s_12,
			fontWeight: '500',
			textAlign: 'center'
		},
		divider: {
			height: 1,
			backgroundColor: theme.border,
			marginHorizontal: size.s_16
		}
	});
