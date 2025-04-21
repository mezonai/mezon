import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		textLink: { color: colors.textLink, marginBottom: size.s_6 },
		mapView: { minHeight: size.s_100, width: '100%', marginTop: size.s_6 }
	});
