import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_20
		},
		title: {
			color: colors.textStrong,
			margin: size.s_2
		},
		code: {
			color: colors.textDisabled,
			fontSize: size.small,
			margin: size.s_2,
			fontWeight: '300'
		},
		userItem: {
			justifyContent: 'space-between',
			flexDirection: 'row',
			paddingTop: size.s_10,
			gap: size.s_8
		},
		userRowItem: {
			flex: 1,
			gap: size.s_4,
			marginVertical: size.s_2,
			paddingBottom: size.s_10,
			borderBottomWidth: 1,
			borderBottomColor: colors.border
		},
		userRowHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		username: {
			color: colors.text,
			paddingHorizontal: size.s_10
		},
		cursor: {
			flexDirection: 'row',
			gap: size.s_10,
			height: size.s_60,
			justifyContent: 'space-between',
			margin: size.s_10
		},
		cursorItem: {
			height: size.s_30,
			width: (screenWidth - size.s_100) / 2,
			flex: 1,
			backgroundColor: colors.borderDim,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_8
		},
		page: {
			justifyContent: 'center',
			alignItems: 'center',
			height: size.s_50,
			width: size.s_60,
			borderRadius: size.s_4,
			backgroundColor: colors.borderDim
		},
		cardWallet: {
			borderRadius: size.s_10,
			marginBottom: size.s_20,
			backgroundColor: colors.border,
			borderWidth: 0.3,
			borderColor: colors.textDisabled
		},
		cardWalletWrapper: {
			padding: size.s_16,
			paddingVertical: size.s_14,
			gap: size.s_14
		},
		cardWalletLine: {
			flexDirection: 'row',
			alignItems: 'flex-end',
			justifyContent: 'space-between'
		},
		cardTitle: {
			fontSize: size.s_12,
			fontWeight: '600',
			color: colors.text
		},
		cardAmount: {
			fontSize: size.s_18,
			fontWeight: 'bold',
			color: colors.white
		},
		heading: {
			color: colors.textStrong,
			marginBottom: size.s_15,
			fontSize: size.s_18,
			fontWeight: 'bold'
		},
		tabFilter: {
			borderRadius: size.s_10,
			backgroundColor: colors.secondaryLight,
			padding: size.s_4,
			marginBottom: size.s_6,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		itemFilter: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			paddingVertical: size.s_6,
			borderRadius: size.s_10,
			backgroundColor: colors.secondaryLight
		},
		itemFilterActive: {
			backgroundColor: colors.bgViolet
		},
		textFilter: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '600'
		},
		textFilterActive: {
			color: colors.white
		},
		listContainer: {
			flexGrow: 1
		},
		loadMoreChannelMessage: {
			paddingVertical: size.s_20,
			alignItems: 'center',
			justifyContent: 'center'
		}
	});
