import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1
		},
		wrapper: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_20,
			paddingTop: size.s_16
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_18
		},
		headerTitle: {
			fontSize: size.s_18,
			color: colors.white,
			fontWeight: '600'
		},
		inputWrapper: {
			backgroundColor: colors.secondaryLight,
			paddingHorizontal: size.s_6
		},
		contentWrapper: {
			marginVertical: size.s_12,
			marginHorizontal: size.s_6,
			flex: 1
		},
		emptyContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			gap: size.s_20
		},
		emptyImage: {
			width: size.s_165,
			height: size.s_165,
			resizeMode: 'contain'
		},
		emptyText: {
			color: colors.text,
			fontSize: size.s_16,
			textAlign: 'center'
		}
	});
