import { Attributes, Colors, Metrics, size } from '@mezon/mobile-ui';
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
		groupAvatarWrapper: {
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_28,
			overflow: 'hidden'
		},
		groupAvatar: {
			backgroundColor: Colors.orange,
			borderRadius: 50,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden'
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
			backgroundColor: Colors.green
		},
		offline: {
			backgroundColor: Colors.bgGrayDark
		},
		avatarSize: {
			width: size.s_50,
			height: size.s_50
		},
		avatarWrapper: {
			marginTop: size.s_10,
			alignItems: 'center',
			gap: size.s_4
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
