import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			flex: 1
		},
		backHeader: {
			width: size.s_50,
			height: size.s_50,
			backgroundColor: 'rgba(0,0,0,0.4)',
			borderRadius: size.s_50,
			alignItems: 'center',
			justifyContent: 'center',
			padding: size.s_10,
			zIndex: 10
		},
		footer: {
			backgroundColor: '#00000090',
			position: 'absolute',
			bottom: 0,
			left: 0,
			right: 0,
			padding: '10%',
			height: '20%',
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center'
		},
		mainOverlay: {
			flex: 1,
			width: '100%',
			height: '100%',
			top: 0,
			left: 0,
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0,0,0,0.2)'
		},
		overlay: {
			backgroundColor: 'rgba(0,0,0,0.2)',
			width: '100%',
			height: '100%',
			top: 0,
			left: 0,
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center'
		},
		overlayCenter: {
			width: '100%',
			height: size.s_60 * 4,
			alignSelf: 'center',
			justifyContent: 'center',
			flexDirection: 'row'
		},
		overlayCenterSub: {
			backgroundColor: 'rgba(0,0,0,0.2)',
			width: '100%',
			height: '100%'
		},
		squareMain: {
			width: size.s_60 * 4,
			height: size.s_60 * 4,
			zIndex: 10
		},
		square: {
			width: size.s_60 * 4,
			height: size.s_60 * 4,
			borderWidth: size.s_4,
			borderRadius: size.s_6,
			borderColor: 'white',
			backgroundColor: 'transparent',
			zIndex: 1,
			alignSelf: 'center'
		},
		popupLogin: {
			position: 'absolute',
			backgroundColor: '#ffffff',
			flex: 1,
			width: '100%',
			height: '100%',
			top: 0,
			left: 0,
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center'
		},
		popupLoginSub: {
			backgroundColor: colors.primary,
			width: '90%',
			paddingTop: size.s_50,
			paddingBottom: size.s_30,
			paddingHorizontal: size.s_10,
			borderRadius: size.s_10,
			alignItems: 'center',
			justifyContent: 'center'
		},
		title: {
			color: colors.text,
			fontSize: size.s_28,
			fontWeight: 'bold',
			paddingBottom: size.s_6,
			marginTop: size.s_30,
			marginBottom: size.s_4,
			textAlign: 'center'
		},
		subTitle: {
			color: baseColor.bgDanger,
			fontSize: size.s_16,
			marginBottom: size.s_30,
			textAlign: 'center',
			paddingHorizontal: size.s_20
		},
		subTitleSuccess: {
			color: colors.text,
			fontSize: size.s_14,
			marginBottom: size.s_30
		},
		button: {
			backgroundColor: baseColor.blurple,
			padding: size.s_10,
			borderRadius: size.s_6,
			width: '92%',
			alignItems: 'center',
			justifyContent: 'center',
			marginVertical: size.s_4
		},
		buttonBorder: {
			borderWidth: 2,
			borderColor: '#ededed'
		},
		buttonText: {
			color: baseColor.white,
			fontSize: size.s_14,
			fontWeight: '600',
			paddingVertical: size.s_2
		},
		buttonTextOutline: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '600',
			paddingVertical: size.s_2
		},
		textMyQRCode: {
			color: 'white',
			fontSize: size.s_14,
			fontWeight: '600',
			paddingVertical: size.s_2
		},
		iconLogin: {
			width: size.s_50 * 2,
			height: size.s_50 * 2
		},
		iconLibrary: {
			backgroundColor: 'rgba(0,0,0,0.4)',
			borderRadius: size.s_10,
			padding: size.s_10,
			alignItems: 'center',
			justifyContent: 'center',
			position: 'absolute',
			bottom: size.s_60,
			left: size.s_30
		}
	});
