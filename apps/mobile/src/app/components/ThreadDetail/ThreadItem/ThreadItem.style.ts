import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		threadItemWrapper: {
			flexDirection: 'row',
			backgroundColor: colors.secondary,
			alignItems: 'center',
			padding: size.s_10,
			justifyContent: 'space-between',
			borderTopColor: colors.borderDim,
			borderTopWidth: 0.2
		},
		threadName: { fontSize: size.label, color: colors.textStrong, fontWeight: '500' },
		threadContent: { flexDirection: 'row', alignItems: 'center' },
		textThreadCreateBy: { fontSize: size.medium, color: colors.textDisabled, fontWeight: '500', width: '40%' },
		bullet: { marginHorizontal: 5, fontSize: size.s_18, color: colors.textDisabled, marginLeft: size.s_10 },
		createTime: { fontSize: size.medium, color: colors.textDisabled, fontWeight: '500' },
		messageContent: {
			marginLeft: size.s_6,
			fontSize: size.medium,
			color: colors.textDisabled,
			fontWeight: '500',
			flexGrow: 1,
			flexShrink: 1
		}
	});
