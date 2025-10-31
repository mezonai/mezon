import type { Attributes } from '@mezon/mobile-ui';
import { Metrics, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape?: boolean) =>
	StyleSheet.create({
		cateContainer: {
			gap: size.s_10
		},
		wrapperCateContainer: {
			paddingVertical: size.s_10
		},
		cateItem: {
			padding: 5,
			borderRadius: size.s_10
		},
		emojisPanel: {
			flexDirection: 'row',
			flexWrap: 'wrap'
		},
		wrapperIconEmoji: {
			width: (isTabletLandscape ? Metrics.screenWidth * 0.7 - size.s_22 : Metrics.screenWidth - size.s_22) / 9,
			paddingVertical: size.s_10,
			alignSelf: 'center'
		},
		iconEmoji: {
			width: (isTabletLandscape ? Metrics.screenWidth * 0.7 - size.s_20 : Metrics.screenWidth - size.s_20) / 9 - size.s_6,
			height: size.s_30
		},
		displayByCategories: {
			marginBottom: size.s_10
		},
		titleCategories: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: 'bold',
			paddingBottom: size.s_4,
			textTransform: 'uppercase'
		},
		textInputWrapper: {
			flexDirection: 'row',
			backgroundColor: colors.secondary,
			marginVertical: 10,
			alignItems: 'center',
			paddingHorizontal: 10,
			borderRadius: 10,
			gap: 10
		},
		textInput: {
			color: colors.textStrong,
			flexGrow: 1,
			fontSize: size.medium,
			height: size.s_40
		},
		clanLogo: {
			height: size.s_24,
			width: size.s_24,
			borderRadius: size.s_12,
			overflow: 'hidden'
		},
		clanLogoText: {
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			borderRadius: size.s_20,
			height: size.s_27,
			width: size.s_27
		},
		clanNameText: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '600'
		},
		wrapperIconEmojiLocked: {
			position: 'absolute',
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			left: 0,
			top: size.s_10,
			width: (isTabletLandscape ? Metrics.screenWidth * 0.7 - size.s_20 : Metrics.screenWidth - size.s_20) / 9 - size.s_6,
			height: size.s_30,
			zIndex: 1
		},
		categoryHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_2
		},
		chevronIcon: {
			marginBottom: size.s_4
		},
		primaryBackground: {
			backgroundColor: colors.primary
		},
		flatListStyle: {
			marginBottom: -size.s_20
		},
		flatListContentContainer: {
			minHeight: '100%'
		},
		columnWrapper: {
			justifyContent: 'space-between'
		},
		emojiListContainer: {
			flex: 1
		},
		cateItemActive: {
			backgroundColor: baseColor.blurple
		},
		cateItemInactive: {
			backgroundColor: 'transparent'
		}
	});
