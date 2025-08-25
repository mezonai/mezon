import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		closeIcon: {
			color: 'white'
		},
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingTop: Platform.OS === 'ios' ? size.s_40 : 0
		},
		bgDefault: {
			backgroundColor: colors.primary
		},
		fill: {
			paddingHorizontal: size.s_20,
			flex: 1
		},
		headerWrapper: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			paddingVertical: Metrics.size.l,
			paddingHorizontal: Metrics.size.l,
			backgroundColor: colors.secondary
		},
		buttonHeader: {
			width: size.s_30,
			alignItems: 'center'
		},
		headerContent: {
			alignItems: 'center',
			justifyContent: 'space-between',
			flexBasis: 10,
			flexGrow: 1,
			flexDirection: 'row'
		},
		textTitle: {
			color: colors.textStrong,
			fontSize: size.s_16,
			fontWeight: '600'
		},
		confirm: {
			color: colors.textStrong,
			fontSize: size.s_18,
			textAlign: 'right'
		}
	});
