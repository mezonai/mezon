import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		optionSearchContainer: {
			backgroundColor: colors.primary
		},
		headerTitle: {
			color: colors.text,
			fontSize: size.label,
			fontWeight: '600',
			height: size.s_50,
			borderBottomColor: colors.border,
			borderBottomWidth: 4,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_10
		},
		wrapperOption: {
			flexDirection: 'row',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_16,
			alignItems: 'center',
			gap: size.s_10,
			borderTopColor: '#3b3d44',
			borderTopWidth: 0.2
		},
		textOption: {
			color: colors.text,
			fontSize: size.s_13,
			fontWeight: '500',
			maxWidth: 200
		},
		content: {
			flexDirection: 'row',
			alignItems: 'center'
		}
	});
