import { Attributes, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: size.s_20
		},
		description: {
			fontSize: size.s_12,
			color: colors.textDisabled,
			fontWeight: '400',
			marginBottom: size.s_10,
			paddingHorizontal: size.s_6
		},
		textLink: {
			fontSize: size.s_12,
			color: colors.textLink,
			fontWeight: '400'
		},
		headerWrapper: {
			paddingHorizontal: size.s_20,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingTop: Platform.OS === 'android' ? size.s_10 : 0
		},
		headerTitle: {
			fontSize: size.s_18,
			color: colors.text,
			fontWeight: 'bold'
		},
		rootContainer: {
			flex: 1
		},
		backButton: {
			width: size.s_60,
			paddingVertical: size.s_10
		},
		headerSpacer: {
			width: size.s_60
		},
		scrollContainer: {
			flex: 1
		},
		integrationsContainer: {
			paddingHorizontal: size.s_10,
			backgroundColor: colors.primary,
			width: '100%',
			height: '100%'
		}
	});
