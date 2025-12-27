import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const createContainerStyle = (
	marginVertical: number | null = size.s_18,
	paddingBottom: number | null = size.s_18,
	marginBottom?: number | null
) =>
	StyleSheet.create({
		container: {
			gap: size.s_12,
			paddingBottom: paddingBottom ?? size.s_18,
			marginVertical: marginVertical ?? size.s_18,
			...(marginBottom !== null && { marginBottom })
		}
	});
