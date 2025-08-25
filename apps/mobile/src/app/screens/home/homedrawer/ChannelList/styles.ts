import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTablet: boolean) =>
	StyleSheet.create({
		mainList: {
			height: '100%',
			flex: 1,
			overflow: 'hidden',
		},
		channelListSearch: {
			width: '100%',
			paddingHorizontal: 8,
			marginBottom: size.s_16,
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: size.s_8,
			alignItems: 'center'
		},
		channelListSearchWrapperInput: {
			backgroundColor: '#1E1E1E',
			flex: 1,
			borderRadius: size.s_16,
			alignItems: 'center',
			paddingHorizontal: size.s_6,
			gap: 10,
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		channelListSearchInput: {
			height: size.s_34,
			padding: 0,
			flex: 1
		},
		inviteIconWrapper: {
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 50,
			backgroundColor: isTablet ? colors.secondary : colors.primary,
			width: size.s_40,
			height: size.s_40
		},
		searchBox: {
			backgroundColor: isTablet ? colors.secondary : colors.primary,
			borderRadius: size.s_50,
			paddingHorizontal: isTablet ? Metrics.size.l : Metrics.size.m,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: Metrics.size.m,
			flexBasis: size.s_50,
			flexGrow: 1,
			paddingVertical: size.s_8
		},
		placeholderSearchBox: {
			color: colors.text,
			fontSize: size.s_14
		},
		titleEvent: {
			fontSize: size.s_14,
			color: colors.textStrong
		},
		buttonBadgeCountText: { textAlign: 'center', fontSize: size.medium, fontWeight: '600', color: 'white', textTransform: 'uppercase' },
		buttonBadgeCount: {
			backgroundColor: baseColor.redStrong,
			position: 'absolute',
			borderRadius: size.s_20,
			paddingHorizontal: size.s_6,
			padding: size.s_4,
			bottom: size.s_100,
			left: '30%'
		}
	});
