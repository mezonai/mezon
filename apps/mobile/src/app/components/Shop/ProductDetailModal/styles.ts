/* eslint-disable prettier/prettier */
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0,0,0,0.5)'
		},
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		},
		modal: {
			backgroundColor: themeValue.secondary,
			borderRadius: size.s_12,
			elevation: size.s_8,
			width: '95%'
		},
		closeBtn: {
			position: 'absolute',
			top: size.s_6,
			right: size.s_6,
			width: size.s_30,
			height: size.s_30,
			backgroundColor: 'rgba(0,0,0,0.7)',
			borderRadius: size.s_16,
			zIndex: 100
		},
		closeBtnText: {
			textAlign: 'center',
			fontSize: size.s_22,
			color: 'white',
			fontWeight: 'bold'
		},
		imageContainer: {
			marginVertical: size.s_18,
			height: size.s_150,
			justifyContent: 'center',
			alignItems: 'center',
		},
		image: {
			width: '100%',
			height: '100%'
		},
		infoContainer: {
			paddingHorizontal: size.s_14,
			gap: size.s_16
		},
		productName: {
			fontSize: size.s_22,
			fontWeight: 'bold',
			color: themeValue.text,
			textAlign: 'center'
		},
		featuresContainer: {
			backgroundColor: themeValue.tertiary,
			padding: size.s_12,
			borderRadius: size.s_8,
			marginBottom: size.s_12
		},
		featuresTitle: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: themeValue.text,
			marginBottom: size.s_12,
			textAlign: 'center'
		},
		featureRow: {
			flexDirection: 'row',
			marginLeft: size.s_6,
			gap: size.s_8,
			marginBottom: size.s_8,
			paddingVertical: size.s_4
		},
		featureLabel: {
			fontSize: size.s_14,
			color: themeValue.text,
			fontWeight: '500',
		},
		featureValue: {
			fontSize: size.s_14,
			color: themeValue.text,
			fontWeight: '600',
      maxWidth: '80%',
		},
		actionContainer: {
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_16,
			borderRadius: size.s_12
		},
		buyBtn: {
			flexDirection: 'row',
			justifyContent: 'center',
			gap: size.s_8,
			backgroundColor: themeValue.tertiary,
			paddingVertical: size.s_12,
			borderRadius: size.s_10,
			alignItems: 'center'
		},
		buyBtnText: {
			color: themeValue.textStrong,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		lockOverlay: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			transform: [{ translateX: -size.s_16 }, { translateY: -size.s_16 }],
		},
	});
