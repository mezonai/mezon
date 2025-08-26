import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	textError: {
		fontSize: size.s_12,
		color: baseColor.redStrong,
		fontStyle: 'italic'
	},
	errorWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: size.s_6,
		marginVertical: size.s_6
	}
});
