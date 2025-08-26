import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row'
	},
	containerDrawerContent: {
		flex: 3
	},
	containerHomeDefault: {
		flex: 7
	},
	drawerHeaderLeft: {
		marginLeft: size.s_14,
		marginRight: size.s_8
	},
	drawerHeaderTitle: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	drawerHeaderTitleTxt: {
		color: 'black',
		fontWeight: 'bold',
		marginLeft: size.s_10,
		fontSize: size.s_16
	},
	drawerHeaderRight: {
		flexDirection: 'row',
		paddingRight: size.s_20,
		gap: size.s_20
	},
	userVoiceWrapper: { flexDirection: 'row', alignItems: 'center', gap: size.s_10, marginLeft: size.s_30, paddingVertical: size.s_6 },
	userVoiceName: { color: baseColor.gray, fontSize: size.medium, fontWeight: '400' }
});
