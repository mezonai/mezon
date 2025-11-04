import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexGrow: 1,
			backgroundColor: colors.primary
		},
		label: {
			marginBottom: size.s_8,
			marginLeft: size.s_4,
			fontWeight: '600',
			color: colors.textStrong
		},
		description: {
			fontSize: size.s_12,
			marginBottom: size.s_8,
			marginLeft: size.s_4,
			color: colors.textDisabled,
			fontWeight: '400'
		},
		bannerPicker: {
			height: size.s_100,
			backgroundColor: '#f2f2f2',
			borderRadius: size.s_12,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_12,
			overflow: 'hidden'
		},
		bannerPlaceholder: {
			color: '#666'
		},
		bannerImage: {
			width: '100%',
			height: '100%'
		},
		input: {
			borderWidth: 1,
			borderColor: '#ddd',
			borderRadius: size.s_8,
			paddingVertical: size.s_8,
			marginBottom: size.s_12,
			backgroundColor: colors.secondaryLight
		},
		multiline: {
			borderColor: '#ddd',
			backgroundColor: colors.secondaryLight
		},
		inputError: {
			borderColor: baseColor.red
		},
		submitButton: {
			backgroundColor: baseColor.blurple,
			paddingVertical: size.s_12,
			marginHorizontal: size.s_16,
			borderRadius: size.s_8,
			alignItems: 'center',
			marginBottom: size.s_12
		},
		buttonDisabled: {
			backgroundColor: baseColor.flamingo
		},
		submitText: {
			color: '#fff',
			fontWeight: '600'
		},
		form: {
			flex: 1,
			backgroundColor: colors.primary,
			borderRadius: size.s_10,
			gap: size.s_4,
			paddingHorizontal: size.s_16
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			width: '100%'
		},
		backButton: {
			padding: size.s_16
		},
		resetButton: {
			color: baseColor.blurple
		},
		name: {
			textAlign: 'center',
			fontWeight: 'bold',
			fontSize: size.s_18,
			color: colors.white,
			maxWidth: '50%',
			alignSelf: 'center'
		},
		titleWrapper: {
			position: 'absolute',
			alignSelf: 'center',
			width: '100%',
			zIndex: -1
		},
		banner: {
			backgroundColor: baseColor.bgDeepLavender,
			borderRadius: size.s_12,
			marginBottom: size.s_12,
			paddingVertical: size.s_12,
			justifyContent: 'center',
			alignItems: 'center'
		},
		communityTitle: {
			fontSize: size.s_24,
			color: baseColor.white,
			fontWeight: '600',
			marginVertical: size.s_12
		},
		communityDescription: {
			fontSize: size.s_13,
			color: baseColor.white,
			width: '80%',
			textAlign: 'center',
			fontWeight: '500',
			marginBottom: size.s_8
		},
		communitySubtitle: {
			fontSize: size.s_12,
			color: baseColor.white,
			width: '80%',
			textAlign: 'center',
			fontWeight: '400',
			marginBottom: size.s_8
		},
		urlPrefix: {
			paddingLeft: size.s_12,
			backgroundColor: colors.secondaryLight
		},
		urlPrefixText: {
			color: colors.textDisabled
		},
		imagePicker: {
			marginBottom: size.s_10,
			backgroundColor: colors.secondaryLight,
			borderColor: colors.secondaryLight
		}
	});
