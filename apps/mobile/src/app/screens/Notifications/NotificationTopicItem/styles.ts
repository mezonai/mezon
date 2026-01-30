import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifyContainer: {
			paddingHorizontal: size.s_10,
			marginBottom: size.s_10,
			borderBottomWidth: size.s_2,
			borderBottomColor: colors.secondaryLight,
			paddingVertical: size.s_6
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
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '400',
			marginBottom: size.s_4
		},

		notifyDuration: {
			color: colors.textStrong
		},

		boxImage: {
			marginTop: size.s_4,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden'
		},

		image: {
			width: '90%',
			height: '90%',
			borderRadius: size.s_50
		},

		username: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: 'bold'
		}
	});
