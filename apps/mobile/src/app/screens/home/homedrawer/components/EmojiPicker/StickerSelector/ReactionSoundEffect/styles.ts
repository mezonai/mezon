import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		scrollViewContainer: {
			paddingHorizontal: size.s_10,
			paddingBottom: size.s_10
		},
		btnWrap: {
			display: 'flex',
			flexDirection: 'row',
			gap: size.s_6,
			marginTop: size.s_10
		},
		btnEmo: {
			padding: size.s_4,
			borderRadius: size.s_10
		},
		btnEmoImage: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_24,
			overflow: 'hidden',
			backgroundColor: colors.secondary
		},
		btnEmoSelected: {
			backgroundColor: baseColor.blurple
		},
		btnEmoUnselected: {
			backgroundColor: 'transparent'
		},
		imageFull: {
			height: '100%',
			width: '100%'
		},
		forSaleContainer: {
			flex: 1,
			backgroundColor: colors.secondary,
			justifyContent: 'center',
			alignItems: 'center'
		},
		forSaleText: {
			color: colors.textStrong,
			fontSize: size.s_16,
			fontWeight: 'bold'
		}
	});
