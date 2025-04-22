import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperRequesting: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		titleRequesting: {
			fontSize: size.medium,
			color: Colors.white
		}
	});
