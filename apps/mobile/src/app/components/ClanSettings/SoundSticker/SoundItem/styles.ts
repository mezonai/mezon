import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';
const { width } = Dimensions.get('screen');

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			paddingHorizontal: size.s_20,
			backgroundColor: colors.primary,
			paddingVertical: size.s_10,
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: size.s_10,
			height: size.s_50,
			flex: 1,
			borderBottomWidth: 1,
			borderBottomColor: colors.border
		},
		rightItem: {
			backgroundColor: baseColor.flamingo,
			paddingHorizontal: size.s_15,
			justifyContent: 'center',
			alignItems: 'center',
			paddingVertical: size.s_15
		},
		deleteButton: {
			justifyContent: 'center',
			alignItems: 'center'
		},
		lightTitle: {
			color: colors.white,
			maxWidth: width * 0.3,
			fontSize: size.s_14
		},
		emojiName: {
			maxWidth: width * 0.35,
			flexDirection: 'row',
			alignItems: 'center',
			width: 'auto'
		},
		title: {
			color: colors.borderRadio,
			maxWidth: '75%',
			fontSize: size.s_12
		},
		whiteText: {
			color: colors.white,
			fontWeight: 'bold',
			fontSize: size.s_14,
			marginBottom: size.s_4
		},
		deleteText: {
			color: 'white',
			fontWeight: 'bold',
			fontSize: size.s_14
		},
		emoji: {
			height: size.s_30,
			width: size.s_30,
			resizeMode: 'stretch'
		},
		emojiItem: {
			flexDirection: 'row',
			width: 'auto',
			alignItems: 'center',
			flexGrow: 0,
			gap: size.s_10,
			maxWidth: width * 0.45,
			minWidth: width * 0.35
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h2,
			color: baseColor.white,
			fontWeight: 'bold'
		},
		imgWrapper: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_30
		},
		user: {
			flexDirection: 'row',
			gap: size.s_10,
			alignItems: 'center',
			justifyContent: 'flex-end',
			flex: 1,
			maxWidth: '70%'
		},
		audioPlay: {
			justifyContent: 'center',
			alignItems: 'center'
		}
	});
