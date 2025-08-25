import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
import { transparent } from 'tailwindcss/colors';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		headerModal: { backgroundColor: transparent },
		input: {
			height: size.s_40,
			padding: 10,
			backgroundColor: baseColor.azureBlue,
			borderRadius: 8,
			color: 'white',
			marginBottom: size.s_6
		},
		wrapperCreateClanModal: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_20,
			paddingTop: size.s_50,
			width: '100%',
			height: '100%'
		},
		headerTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: colors.textStrong,
			textAlign: 'center',
			marginBottom: size.s_8
		},
		headerSubTitle: {
			fontSize: size.label,
			fontWeight: '400',
			color: colors.text,
			textAlign: 'center',
			marginBottom: size.s_6
		},

		uploadImage: {
			width: size.s_100,
			height: size.s_100,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_50,
			borderStyle: 'dashed',
			borderColor: colors.borderRadio,
			borderWidth: 1
		},
		boxImage: {
			width: '100%',
			height: 150,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center'
		},
		uploadCreateClan: {
			width: '100%',
			height: '100%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			position: 'relative'
		},
		addIcon: {
			position: 'absolute',
			top: 0,
			right: 0
		},
		serverName: {
			fontSize: size.label,
			fontWeight: '600',
			color: '#c7c7c7',
			marginBottom: size.s_6
		},
		community: {
			fontSize: size.medium,
			fontWeight: '500',
			color: colors.text,
			marginBottom: size.s_6
		},
		communityGuideLines: {
			color: baseColor.azureBlue
		},
		button: {
			width: '100%',
			marginTop: size.s_10,
			paddingVertical: size.s_12,
			backgroundColor: '#5865f2',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		},
		buttonText: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: 'white'
		},
		uploadText: {
			fontSize: size.s_14,
			fontWeight: '500',
			color: colors.textDisabled
		},
		overflowImage: {
			overflow: 'hidden'
		},
		image: {
			width: '100%',
			height: '100%',
			borderRadius: 50
		},
		errorMessage: { paddingRight: size.s_20 }
	});
