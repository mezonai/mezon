import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			padding: Metrics.size.xl
		},
		headerTitle: {
			textAlign: 'center',
			color: colors.textStrong,
			fontSize: size.h6,
			fontWeight: '700',
			marginBottom: size.s_10
		},
		optionsSetting: {
			backgroundColor: colors.secondary,
			borderRadius: 8,
			marginBottom: size.s_10
		},
		option: {
			flexDirection: 'row',
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_10,
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		labelOption: {
			color: colors.text,
			fontSize: size.label,
			fontWeight: '600',
			fontFamily: 'JosefinSans-Regular'
		},
		iconImageStyle: {},
		defaultNotifyName: {
			color: colors.text,
			fontSize: size.s_14,
			textTransform: 'capitalize'
		},
		checkbox: {
			width: 35,
			height: 35
		},
		leftIcon: { flexDirection: 'row', alignItems: 'center' }
	});
