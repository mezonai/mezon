import { type Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, entitySize: { button: number; marginLeft: number }) =>
	StyleSheet.create({
		quickReactionContainer: {
			position: 'absolute',
			bottom: 0,
			left: entitySize.marginLeft,
			zIndex: 10000,
			backgroundColor: colors.secondary,
			borderColor: colors.textDisabled,
			borderRadius: entitySize.button,
			borderWidth: 1,
			width: entitySize.button,
			height: entitySize.button,
			overflow: 'hidden',
			justifyContent: 'center',
			alignItems: 'center'
		},
		quickReactionEmoji: {
			width: entitySize.button * 0.8,
			height: entitySize.button * 0.8,
			borderRadius: entitySize.button * 0.8
		}
	});
