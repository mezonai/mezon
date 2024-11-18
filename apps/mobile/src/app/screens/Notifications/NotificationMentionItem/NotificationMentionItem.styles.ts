import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		notifyContainer: {
			paddingHorizontal: size.s_10,
			marginBottom: size.s_10
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
			borderRadius: 50,
			marginBottom: 10,
			fontSize: size.medium
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
			borderLeftColor: colors.borderHighlight,
			borderLeftWidth: 3,
			paddingLeft: 8,
			fontSize: size.medium
		},
		username: {
			fontSize: size.medium
		}
	});
