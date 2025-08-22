import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		messageBoxTop: {
			gap: size.s_2,
			justifyContent: 'center'
		},
		usernameMessageBox: {
			fontSize: size.medium,
			marginRight: size.s_10,
			fontWeight: '600',
			color: Colors.white
		},
		dateMessageBox: {
			fontSize: size.small,
			color: Colors.white
		},
		wrapperAvatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: Colors.gray72,
			overflow: 'hidden'
		},
		imageWrapper: {
			width: size.s_40,
			height: size.s_60,
			alignItems: 'center',
			justifyContent: 'center',
			marginHorizontal: size.s_2
		},
		imageSelected: {
			borderWidth: 2,
			borderColor: Colors.azureBlue
		},
		image: {
			width: '100%',
			height: '100%',
			borderRadius: 3
		},
		option: {
			flexDirection: 'row',
			gap: size.s_10
		}
	});
