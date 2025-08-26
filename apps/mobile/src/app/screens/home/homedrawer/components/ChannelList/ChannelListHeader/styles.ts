import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		listHeader: {
			width: '100%'
		},
		titleNameWrapper: {
			display: 'flex',
			flexDirection: 'row',
			gap: Metrics.size.s,
			alignItems: 'center',
			paddingBottom: size.s_4
		},
		titleServer: {
			color: colors.text,
			fontWeight: 'bold',
			fontSize: size.s_15,
			flexShrink: 1
		},
		subTitle: {
			color: colors.textDisabled,
			fontSize: size.s_12,
			fontWeight: '600'
		},

		infoHeader: {
			width: '100%',
			display: 'flex',
			flexDirection: 'row',
			gap: 5,
			alignItems: 'center'
		},

		textInfo: {
			color: baseColor.gray,
			fontSize: Fonts.size.h9
		},
		actions: {
			padding: 4,
			borderRadius: 999
		},
		container: {
			width: '100%',
			borderBottomWidth: 1,
			paddingVertical: size.s_14,
			borderBottomColor: colors.border,
			paddingHorizontal: size.s_12,
			zIndex: 2
		},
		wrapperSearch: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			height: size.s_36,
			gap: size.s_8,
			borderRadius: size.s_20,
			backgroundColor: colors.primary,
			borderWidth: 1,
			borderColor: colors.secondaryLight
		},
		placeholderSearchBox: {
			color: colors.text,
			fontSize: size.s_14,
			lineHeight: size.s_18
		},
		iconWrapper: {
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_36,
			backgroundColor: colors.primary,
			width: size.s_36,
			height: size.s_36
		}
	});
