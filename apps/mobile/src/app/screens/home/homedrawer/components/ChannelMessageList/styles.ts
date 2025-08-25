import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		loadMoreChannelMessage: {
			height: size.s_40,
			alignItems: 'center',
			justifyContent: 'center'
		},
		listChannels: {
			paddingTop: size.s_14,
			paddingBottom: size.s_30,
		},
		wrapperLoadMore: {
			position: 'absolute',
			left: 0,
			backgroundColor: 'transparent',
			height: size.s_40,
			width: '100%',
			paddingVertical: size.s_20,
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 1000
		}
	});
