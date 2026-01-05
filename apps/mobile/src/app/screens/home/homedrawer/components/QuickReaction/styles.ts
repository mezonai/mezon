import { size, type Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, buttonSize: number) =>
	StyleSheet.create({
		quickReactionContainer: {
			position: 'absolute',
			bottom: 0,
			left: size.s_8,
			zIndex: 10000,
			backgroundColor: colors.secondary,
			borderColor: colors.borderRadio,
			borderRadius: buttonSize,
			borderWidth: 2,
			width: buttonSize,
			height: buttonSize,
			overflow: 'hidden',
			justifyContent: 'center',
			alignItems: 'center'
		},
		quickReactionEmoji: {
			width: buttonSize * 0.8,
			height: buttonSize * 0.8,
			borderRadius: buttonSize * 0.8
		}
	});
