import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		bsContainer: {
			padding: Metrics.size.xl
		},
		input: {
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: size.s_12
		},
		fakeBox: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			gap: Metrics.size.l,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_12,
			borderRadius: size.s_12
		},
		text: {
			color: colors.textStrong,
			flex: 1,
			flexGrow: 1,
			flexBasis: 10,
			fontSize: size.medium
		}
	});
