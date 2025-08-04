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
			marginLeft: size.s_30,
			marginRight: size.s_14,
			color: colors.borderRadio,
			fontSize: size.s_12,
			lineHeight: size.s_16,
			marginBottom: size.s_10,
		},
		requireTitle: {
			marginHorizontal: size.s_20,
			color: colors.borderRadio,
			fontSize: size.s_12,
			lineHeight: size.s_18,
			marginLeft: size.s_28
		},
		lightTitle: {
			marginTop: size.s_6,
			fontWeight: 'bold',
			marginHorizontal: size.s_20,
			color: colors.borderRadio,
			fontSize: size.s_14,
			marginBottom: size.s_4
		},
		emojiSlotsTitle: {
			fontWeight: 'bold',
			marginHorizontal: size.s_20,
			marginVertical: size.s_30,
			color: colors.borderRadio,
			fontSize: size.s_14
		}
	});
