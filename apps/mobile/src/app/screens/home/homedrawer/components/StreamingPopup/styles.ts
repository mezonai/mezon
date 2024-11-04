import { Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		animatedView: {
			zIndex: 999999,
			position: 'absolute'
		}
	});
