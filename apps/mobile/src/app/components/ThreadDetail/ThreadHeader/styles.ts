import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		channelLabelWrapper: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'center',
			gap: size.s_12,
			paddingVertical: Metrics.size.m
		},
		channelText: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			flex: 1,
			alignSelf: 'center',
			maxWidth: '70%'
		},
		dmLabel: {
			color: colors.textStrong,
			fontSize: size.h5,
			fontWeight: '700',
			paddingHorizontal: size.s_18,
			textAlign: 'center'
		},
		channelLabel: {
			color: colors.textStrong,
			marginLeft: size.s_6,
			fontSize: size.h5,
			fontWeight: '700'
		},
		groupAvatar: {
			backgroundColor: baseColor.orange,
			borderRadius: 50,
			justifyContent: 'center',
			alignItems: 'center'
		},
		friendAvatar: {
			borderRadius: 50
		},
		statusCircle: {
			position: 'absolute',
			width: 14,
			height: 14,
			borderRadius: 10,
			bottom: 0,
			right: 0,
			borderWidth: 2,
			borderColor: colors.secondary
		},
		online: {
			backgroundColor: baseColor.green
		},
		offline: {
			backgroundColor: '#676b73'
		},
		avatarSize: {
			width: size.s_50,
			height: size.s_50
		},
		avatarWrapper: {
			alignItems: 'center',
			gap: size.s_14
		},
		iconBackHeader: {
			zIndex: 1000,
			position: 'absolute',
			left: size.s_2,
			padding: size.s_10
		},
		iconMenuHeader: {
			position: 'absolute',
			right: size.s_2,
			padding: size.s_10
		}
	});
