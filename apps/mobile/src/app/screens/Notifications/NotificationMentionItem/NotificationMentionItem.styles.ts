import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifyContainer: {
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_12,
			marginBottom: size.s_6,
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
			flex: 1
		},

		notifyHeaderTitle: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '400'
		},

		notifyDuration: {
			alignSelf: 'center',
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
			borderLeftColor: colors.border,
			borderLeftWidth: 3,
			paddingLeft: size.s_8,
			fontSize: size.medium,
			marginTop: size.s_4
		},
		username: {
			fontSize: size.medium,
			fontWeight: 'bold',
			color: colors.text
		}
	});
