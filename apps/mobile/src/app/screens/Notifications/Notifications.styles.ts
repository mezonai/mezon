import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifications: {
			flex: 1,
			paddingVertical: size.s_10
		},

		notificationsHeader: {
			padding: Metrics.size.m
		},
		wrapperTitleHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			overflow: 'visible',
			paddingLeft: Metrics.size.m
		},
		notificationHeaderTitle: {
			paddingVertical: Metrics.size.m,
			fontSize: Fonts.size.h5,
			fontWeight: '600',
			color: colors.textStrong
		},

		notificationHeaderIcon: {
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.secondary,
			borderRadius: 50,
			borderWidth: 1,
			borderColor: colors.borderDim,
			height: 35,
			width: 35
		},

		notificationsList: {
			paddingBottom: 200
		},

		container: {
			flex: 1,
			padding: 24
		},

		contentContainer: {
			flex: 1,
			alignItems: 'center'
		},

		removeNotifyText: {
			color: 'white',
			fontSize: size.label,
			flex: 1,
			fontWeight: '500'
		},
		removeNotifyContainer: {
			flexDirection: 'row',
			backgroundColor: '#3e4247',
			width: '100%',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_16,
			borderRadius: 8,
			gap: size.s_10
		},
		loadMoreChannelMessage: {
			paddingVertical: size.s_20,
			alignItems: 'center',
			justifyContent: 'center'
		},
		wrapperTabType: {
			marginBottom: size.s_4,
			gap: size.s_6,
			padding: Metrics.size.m,
			overflow: 'visible',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		textTabType: {
			color: colors.text,
			fontSize: size.small
		},
		itemTabType: {
			overflow: 'visible',
			paddingVertical: size.s_6,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_8,
			borderWidth: 1,
			flexGrow: 1
		},
		badgeItemTabType: {
			paddingHorizontal: size.s_2,
			backgroundColor: baseColor.red,
			borderRadius: size.s_18,
			minWidth: size.s_18,
			height: size.s_18,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			position: 'absolute',
			top: -size.s_6,
			right: -size.s_8,
			zIndex: 10,
			overflow: 'visible'
		},
		textBadgeItemTabType: {
			color: 'white',
			fontSize: size.small,
			lineHeight: size.small,
			fontWeight: '500',
			paddingHorizontal: size.s_4,
			textAlign: 'center'
		},
		friendRequestButton: {
			overflow: 'visible',
			backgroundColor: colors.secondary,
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: size.s_30,
			width: size.s_30,
			height: size.s_30,
			justifyContent: 'center',
			alignItems: 'center'
		},
		warningText: {
			color: baseColor.redStrong
		}
	});
