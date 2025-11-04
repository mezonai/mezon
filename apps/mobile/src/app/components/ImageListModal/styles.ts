import { Attributes, baseColor, size } from '@mezon/mobile-ui';
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
			color: 'white'
		},
		dateMessageBox: {
			fontSize: size.small,
			color: 'white'
		},
		wrapperAvatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			justifyContent: 'center',
			alignItems: 'center',
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
			borderColor: baseColor.azureBlue
		},
		image: {
			width: '100%',
			height: '100%',
			borderRadius: 3
		},
		option: {
			flexDirection: 'row',
			gap: size.s_10
		},
		container: {
			flex: 1
		},
		galleryContainer: {
			flex: 1
		},
		savedImageContainer: {
			position: 'absolute',
			top: '50%',
			width: '100%',
			alignItems: 'center'
		},
		savedImageBox: {
			backgroundColor: '#2a2e31',
			padding: size.s_10,
			borderRadius: size.s_10
		},
		savedImageText: {
			color: 'white'
		},
		headerContainer: {
			position: 'absolute',
			left: 0,
			zIndex: 1,
			justifyContent: 'space-between',
			flexDirection: 'row',
			backgroundColor: 'rgba(0, 0, 0, 0.4)',
			width: '100%',
			padding: size.s_10,
			alignItems: 'center'
		},
		headerLeftSection: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},
		uploaderSection: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		}
	});
