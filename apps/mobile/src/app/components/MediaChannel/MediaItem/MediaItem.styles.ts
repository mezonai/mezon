import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	containerItem: {
		position: 'relative',
		width: '100%',
		height: '100%',
		borderWidth: 1,
		borderColor: 'rgba(78,78,78,0.4)',
		borderRadius: size.s_10,
		overflow: 'hidden'
	},
	boxAvatar: {
		position: 'absolute',
		top: size.s_8,
		zIndex: 1,
		right: size.s_8,
		borderRadius: size.s_50,
		borderWidth: 1,
		borderColor: '#242427'
	},
	image: { width: '100%', height: '100%' },
	video: {
		width: '100%',
		height: '100%',
		borderRadius: size.s_4,
		overflow: 'hidden'
	}
});

export default styles;
