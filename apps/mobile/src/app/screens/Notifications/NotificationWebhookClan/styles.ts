import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifyContainer: {
			paddingHorizontal: size.s_10,
			borderBottomWidth: size.s_2,
			borderBottomColor: colors.secondaryLight,
			paddingVertical: size.s_12
		},

		notifyHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4
		},

		notifyContent: {
			flex: 1,
			marginLeft: size.s_6,
			overflow: 'hidden'
		},

		notifyHeaderTitle: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '400'
		},

		notifyDuration: {
			color: colors.textStrong
		},

		boxImage: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden'
		},

		contentMessage: {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			textAlign: 'left',
			alignItems: 'flex-start',
			alignSelf: 'flex-start',
			borderLeftColor: colors.borderDim,
			borderLeftWidth: 3,
			paddingLeft: size.s_8,
			fontSize: size.medium
		},
		username: {
			fontSize: size.medium,
			fontWeight: 'bold',
			color: colors.text
		}
	});
