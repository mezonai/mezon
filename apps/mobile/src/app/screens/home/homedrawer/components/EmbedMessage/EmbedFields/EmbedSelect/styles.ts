import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		bsContainer: {
			padding: Metrics.size.xl
		},
		selectGroup: {
			marginVertical: size.s_8,
			flexDirection: 'row',
			padding: size.s_2,
			gap: size.s_4,
			flexWrap: 'wrap'
		},
		selectItem: {
			flexDirection: 'row',
			gap: size.s_4,
			paddingVertical: size.s_4,
			alignItems: 'center',
			maxWidth: '90%',
			paddingHorizontal: size.s_6,
			backgroundColor: colors.textNormal,
			borderRadius: size.s_8,
			marginBottom: size.s_2
		},
		itemTitle: {
			color: colors.textStrong,
			fontSize: size.small
		}
	});
