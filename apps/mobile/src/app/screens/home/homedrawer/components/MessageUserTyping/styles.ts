import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		typingLabel: {
			paddingBottom: size.s_2,
			paddingLeft: size.s_2,
			fontSize: size.s_14,
			color: colors.text
		},
		threeDot: { width: 30, height: 20 },
		typingContainer: {
			flexDirection: 'row',
			width: '100%',
			paddingBottom: size.s_4,
			paddingHorizontal: size.s_10,
			position: 'absolute',
			bottom: 0,
			backgroundColor: colors.primary
		}
	});
