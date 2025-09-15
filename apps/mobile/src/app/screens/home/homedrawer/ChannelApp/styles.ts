import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { Dimensions, Platform, StyleSheet } from 'react-native';

const height = Dimensions.get('window').height;
export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			height: '100%',
			width: '100%',
			backgroundColor: colors.primary,
			position: 'absolute',
			top: 0,
			left: 0,
			zIndex: 100000000
		},
		containerWebview: {
			width: '100%',
			height: '100%'
		},
		row: {
			flexDirection: 'row',
			gap: size.s_10
		},
		backButton: {
			borderRadius: size.s_30,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			padding: size.s_6,
			justifyContent: 'center',
			alignItems: 'center',
			position: 'absolute',
			flexDirection: 'row',
			gap: size.s_2,
			top: Platform.OS === 'ios' ? size.s_50 : size.s_10,
			left: size.s_10,
			zIndex: 1000
		},
		reloadButton: {
			borderRadius: size.s_30,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			justifyContent: 'space-between',
			padding: size.s_6,
			alignItems: 'center',
			position: 'absolute',
			gap: size.s_6,
			top: size.s_6,
			right: size.s_10,
			zIndex: 1000,
			flexDirection: 'row'
		},
		title: {
			fontSize: size.s_20,
			fontWeight: '500',
			color: colors.textStrong
		},
		textLoading: {
			marginTop: size.s_6,
			fontSize: size.s_14,
			color: colors.text
		},
		buttonText: {
			fontSize: size.s_12,
			color: 'white',
			marginRight: size.s_2,
			fontWeight: 'bold'
		},
		toolTip: {
			minWidth: 220,
			padding: 0,
			borderRadius: size.s_10,
			backgroundColor: colors.secondary,
			top: size.s_20,
			right: -size.s_10
		},
		toolTipContainer: {
			position: 'absolute',
			height: size.s_30,
			width: size.s_30,
			borderRadius: size.s_30,
			top: 0,
			right: 0,
			zIndex: 1000
		}
	});
