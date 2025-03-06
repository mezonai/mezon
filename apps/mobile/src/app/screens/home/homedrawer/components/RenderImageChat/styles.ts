import { Attributes, Colors, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		imageMessageRender: {
			borderRadius: verticalScale(5),
			borderWidth: 0.5,
			borderColor: Colors.borderPrimary,
			marginBottom: size.s_6,
			overflow: 'hidden'
		},
		wrapperTypingLabel: {
			position: 'absolute',
			bottom: 0,
			width: '100%',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_10
		},
		typingLabel: {
			paddingHorizontal: size.s_14,
			paddingVertical: size.s_6,
			fontSize: size.s_14,
			color: colors.text
		},
		overlay: {
			position: 'absolute',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			borderRadius: verticalScale(5)
		},
		moreText: {
			color: colors.white,
			fontSize: 20,
			fontWeight: 'bold'
		}
	});
