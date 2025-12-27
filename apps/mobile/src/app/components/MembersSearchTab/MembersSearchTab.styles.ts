import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const style = (colors: Attributes, isEmptySearch?: boolean) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_20,
			flex: 1
		},
		boxMembers: {
			marginHorizontal: size.s_20,
			marginTop: size.s_10,
			borderRadius: size.s_14,
			backgroundColor: isEmptySearch ? undefined : colors.secondary,
			flex: 1,
			marginBottom: size.s_20
		},
		contentContainerStyle: {
			paddingBottom: size.s_6
		}
	});

export default style;
