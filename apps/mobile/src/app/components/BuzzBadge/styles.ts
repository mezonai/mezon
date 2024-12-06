import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (color: Attributes) =>
	StyleSheet.create({
		textBuzz: {
			fontSize: size.s_14,
			color: color.white
		}
	});
