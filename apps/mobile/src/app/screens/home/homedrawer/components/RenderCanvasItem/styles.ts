import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	buttonContainer: {
		marginTop: size.s_6,
		borderColor: baseColor.link,
		borderWidth: 1,
		padding: size.s_6,
		paddingHorizontal: size.s_16,
		borderRadius: size.s_6
	},
	buttonText: {
		color: baseColor.link,
		textAlign: 'center',
		fontWeight: 'bold'
	}
});
