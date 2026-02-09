import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifyContainer: {
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_12,
			borderBottomWidth: size.s_2,
			borderBottomColor: colors.secondaryLight
		},
		notifyHeader: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'space-between',
			gap: size.s_10
		},
		notifyContent: {
			flex: 1,
			marginLeft: size.s_6
		},
		notifyHeaderTitle: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '400',
			flex: 1
		},
		notifyUserName: {
			color: colors.text,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		notifyDuration: {
			color: colors.textStrong,
			alignSelf: 'center'
		},
		boxImage: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden'
		}
	});
