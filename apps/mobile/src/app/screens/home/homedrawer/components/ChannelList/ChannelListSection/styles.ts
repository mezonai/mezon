import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		channelListSection: {
			width: '100%',
			marginHorizontal: size.s_8
		},
		channelListHeader: {
			width: '100%',
			flexDirection: 'row',
			justifyContent: 'space-between'
		},
		channelListHeaderItem: {
			paddingTop: size.s_8,
			paddingBottom: size.s_8,
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1
		},
		channelListHeaderItemTitle: {
			textTransform: 'uppercase',
			fontSize: size.s_13,
			fontWeight: 'bold',
			color: colors.text
		}
	});
