import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			width: '100%',
			zIndex: 1,
			marginVertical: size.s_4
		},
		containerAll: {
			flex: 1,
			zIndex: 1
		},
		btnSeeAll: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-end',
			paddingRight: size.s_6,
			paddingBottom: size.s_4
		},
		openAllText: {
			fontSize: size.s_12,
			fontWeight: '500',
			color: baseColor.blurple
		},
		listContent: {
			marginTop: size.s_6,
			paddingHorizontal: size.s_12
		},
		itemContainer: {
			width: size.s_40,
			marginRight: size.s_10
		},
		itemLogo: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_8,
			marginBottom: size.s_2,
			borderWidth: 0.5,
			borderColor: 'transparent',
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden'
		},
		itemLogoBorder: {
			borderWidth: 0.5,
			borderColor: colors.textDisabled
		},
		itemIcon: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_6,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden'
		},
		itemIconImg: {
			width: size.s_30,
			height: size.s_30
		},
		itemName: {
			fontSize: size.s_10,
			color: colors.text,
			textAlign: 'center'
		},
		channelListSection: {
			width: '100%',
			zIndex: 1,
			marginHorizontal: size.s_8
		},
		channelListHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			marginHorizontal: size.s_8,
			justifyContent: 'space-between'
		},
		channelListHeaderItem: {
			paddingTop: size.s_8,
			paddingBottom: size.s_8,
			flexDirection: 'row'
		},
		channelListHeaderItemTitle: {
			textTransform: 'uppercase',
			fontSize: size.s_13,
			fontWeight: 'bold',
			color: colors.text,
			marginRight: size.s_16,
			flexShrink: 1
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			padding: size.s_8
		},
		title: {
			fontSize: size.s_18,
			color: colors.textStrong,
			marginLeft: size.s_2
		},
		subtitle: {
			fontSize: size.s_18
		},
		mezonBold: {
			fontWeight: '900'
		},
		productContainer: {
			flex: 1
		},
		backButton: {
			paddingRight: size.s_12
		},
		appListContent: {
			paddingVertical: size.s_16,
			paddingHorizontal: size.s_8,
			flexGrow: 1
		},
		appItemContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: size.s_4,
			paddingBottom: size.s_8,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			borderRadius: size.s_8
		},
		appItemContent: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
			marginRight: size.s_12
		},
		appItemLogo: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_10,
			justifyContent: 'center',
			alignItems: 'center',
			overflow: 'hidden',
			marginRight: size.s_12
		},
		appItemIcon: {
			width: '100%',
			height: '100%',
			borderRadius: size.s_10
		},
		appItemIconPlaceholder: {
			justifyContent: 'center',
			alignItems: 'center'
		},
		appItemInfo: {
			flex: 1,
			justifyContent: 'center'
		},
		appItemName: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: colors.textStrong,
			marginBottom: size.s_4
		},
		appItemDescription: {
			fontSize: size.s_12,
			color: colors.text,
			lineHeight: size.s_18
		},
		appItemSeparator: {
			height: size.s_8
		},
		emptyStateContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			paddingVertical: size.s_50
		},
		emptyStateText: {
			fontSize: size.s_16,
			color: colors.textDisabled,
			marginTop: size.s_16,
			textAlign: 'center'
		}
	});
