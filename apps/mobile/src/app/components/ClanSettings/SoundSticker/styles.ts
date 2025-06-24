import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		headerActionTitle: {
			color: baseColor.blurple,
			fontWeight: 'bold',
			fontSize: size.s_16
		},
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		scrollContainer: {
			backgroundColor: colors.primary
		},
		addEmojiButton: {
			marginHorizontal: size.s_20,
			height: size.s_30,
			backgroundColor: baseColor.blurple,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_15,
			marginVertical: size.s_15
		},
		buttonText: {
			fontSize: size.s_14,
			color: baseColor.white,
			fontWeight: '500'
		},
		title: {
			marginHorizontal: size.s_20,
			color: colors.borderRadio,
			fontSize: size.s_14,
			lineHeight: size.s_18,
			marginBottom: size.s_20
		},
		requireTitle: {
			marginHorizontal: size.s_20,
			color: colors.borderRadio,
			fontSize: size.s_12,
			lineHeight: size.s_18,
			marginLeft: size.s_28
		},
		lightTitle: {
			fontWeight: 'bold',
			marginHorizontal: size.s_20,
			marginVertical: size.s_10,
			color: colors.borderRadio,
			fontSize: size.s_14
		},
		emojiSlotsTitle: {
			fontWeight: 'bold',
			marginHorizontal: size.s_20,
			marginVertical: size.s_30,
			color: colors.borderRadio,
			fontSize: size.s_14
		}
	});
