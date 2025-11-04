import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			paddingHorizontal: size.s_16
		},
		imagePicker: {
			marginBottom: size.s_10,
			backgroundColor: colors.secondaryLight,
			borderColor: colors.secondaryLight
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: size.s_16,
			alignItems: 'center',
			width: '100%'
		},
		backButton: {
			paddingVertical: size.s_16,
			paddingHorizontal: size.s_6
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
		channelName: {
			textAlign: 'center',
			fontWeight: 'bold',
			fontSize: size.medium,
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
		label: {
			marginBottom: size.s_8,
			marginLeft: size.s_4,
			fontWeight: '600'
		},
		requirementCard: {
			borderRadius: size.s_8,
			borderWidth: 1,
			borderColor: colors.border,
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12,
			padding: size.s_12,
			marginBottom: size.s_10
		},
		requirementCardText: {
			fontSize: size.s_12
		},
		semibold: {
			fontWeight: '600'
		},
		clearBannerButton: {
			position: 'absolute',
			right: -size.s_4,
			top: -size.s_6
		}
	});
