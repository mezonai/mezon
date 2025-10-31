import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
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
			paddingHorizontal: size.s_20,
			width: '100%',
			height: '100%'
		},
		title: {
			fontSize: size.h4,
			color: colors.text,
			fontWeight: '600',
			textAlign: 'center',
			marginBottom: size.s_10
		},
		description: {
			fontSize: size.medium,
			fontWeight: '500',
			color: colors.textDisabled,
			textAlign: 'center'
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
			overflow: 'hidden',
			borderRadius: size.s_100
		},
		image: {
			width: '100%',
			height: '100%',
			borderRadius: 50
		},
		errorMessage: { paddingRight: size.s_20 },
		backButton: {
			position: 'absolute',
			top: size.s_10,
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: 10,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20
		},
		headerContainer: {
			marginBottom: size.s_40,
			paddingTop: size.s_20
		}
	});
