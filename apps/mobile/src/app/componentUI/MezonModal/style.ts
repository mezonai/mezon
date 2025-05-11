import { Attributes, Colors, Metrics, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		closeIcon: {
			color: Colors.white
		},
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_20,
			paddingTop: Platform.OS === 'ios' ? size.s_40 : 0
		},
		bgDefault: {
			backgroundColor: colors.primary
		},
		fill: {
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
			flex: 1
		},
		headerContent: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			flexBasis: 10,
			flexGrow: 1
		},
		textTitle: {
			color: colors.textStrong,
			fontSize: size.s_20
		},
		confirm: {
			color: colors.textStrong,
			fontSize: size.s_18,
			textAlign: 'right'
		}
	});
