import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1
		},
		privateChannelContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: size.s_14,
			alignItems: 'center',
			borderRadius: size.s_14,
			backgroundColor: colors.secondary,
			marginBottom: size.s_16
		},
		privateChannelTextContainer: {
			alignItems: 'center'
		},
		privateChannelText: {
			color: colors.text
		},
		descriptionText: {
			color: colors.textDisabled
		},
		addMemberContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			padding: size.s_14,
			alignItems: 'center',
			borderRadius: size.s_14,
			backgroundColor: colors.secondary,
			marginVertical: size.s_16
		},
		addMemberLeftContent: {
			flexDirection: 'row',
			gap: size.s_14,
			alignItems: 'center'
		},
		addMemberText: {
			color: colors.text
		},
		whoCanAccessContainer: {
			gap: size.s_10,
			marginBottom: size.s_10,
			flex: 1
		},
		whoCanAccessListContainer: {
			backgroundColor: colors.secondary,
			borderRadius: size.s_14,
			flex: 1
		},
		headerItemContainer: {
			paddingTop: size.s_12,
			paddingLeft: size.s_12
		},
		headerItemText: {
			fontSize: size.s_14,
			color: colors.white
		}
	});
