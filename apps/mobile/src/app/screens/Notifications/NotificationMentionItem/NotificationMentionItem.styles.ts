import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifyContainer: {
			paddingHorizontal: size.s_10,
			marginBottom: size.s_6,
			borderBottomWidth: size.s_2,
			borderBottomColor: colors.secondaryLight,
			paddingVertical: size.s_6
		},

		notifyHeader: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'space-between',
			gap: 10
		},

		notifyContent: {
			flex: 1,
			marginLeft: size.s_6
		},

		notifyHeaderTitle: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '400',
			marginBottom: 5
		},

		notifyDuration: {
			color: colors.textStrong
		},

		boxImage: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden',
		},

		image: {
			width: '90%',
			height: '90%',
			borderRadius: 50
		},

		contentMessage: {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			textAlign: 'left',
			alignItems: 'flex-start',
			alignSelf: 'flex-start',
			marginBottom: 10,
			borderLeftColor: colors.border,
			borderLeftWidth: 3,
			paddingLeft: 8,
			fontSize: size.medium
		},
		username: {
			fontSize: size.medium,
			fontWeight: 'bold',
			color: colors.text
		}
	});
