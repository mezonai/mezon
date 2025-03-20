import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		channelListSection: {
			width: '100%',
			marginHorizontal: size.s_8,
			backgroundColor: colors.secondary
		}
	});
