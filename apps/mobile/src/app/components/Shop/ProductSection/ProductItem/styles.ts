/* eslint-disable prettier/prettier */
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (theme: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.secondary,
			borderRadius: size.s_12,
			margin: size.s_6,
			minWidth: size.s_150,
			maxWidth: size.s_200
		},
		imageContainer: {
			padding: size.s_12,
			height: size.s_140,
			backgroundColor: theme.secondary,
			justifyContent: 'center',
			alignItems: 'center'
		},
		image: {
			width: '100%',
			height: '100%'
		},
		content: {
			padding: size.s_12
		},
		name: {
			fontSize: size.s_14,
			fontWeight: 'bold',
			color: theme.textStrong
		},
		buyBadge: {
			backgroundColor: theme.secondaryLight,
			borderRadius: size.s_20,
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_6,
			marginTop: size.s_16,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: size.s_4
		},
		buyBtnText: {
			color: theme.textStrong,
			fontSize: size.s_12,
			fontWeight: 'bold',
			textAlign: 'center'
		},
		lockOverlay: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			transform: [{ translateX: -size.s_16 }, { translateY: -size.s_16 }],
		},
	});
