import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, widthScreen: number) =>
	StyleSheet.create({
		content: {
			height: (widthScreen - size.s_6 * size.s_10) / 5.1,
			width: (widthScreen - size.s_6 * size.s_10) / 5.1,
			borderRadius: 10,
			overflow: 'hidden'
		},
		audioContent: {
			width: (widthScreen - size.s_30) / 2.01,
			height: size.s_90,
			borderRadius: 10,
			overflow: 'hidden',
			borderWidth: 1,
			borderColor: colors.border,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6
		},
		btnEmo: {
			padding: size.s_4,
			borderRadius: size.s_10
		},
		btnEmoImage: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_24,
			overflow: 'hidden',
			backgroundColor: colors.secondary
		},
		btnWrap: {
			display: 'flex',
			flexDirection: 'row',
			gap: size.s_6,
			marginTop: size.s_10
		},
		session: {},
		sessionTitle: {
			fontSize: size.medium,
			color: colors.text,
			fontWeight: 'bold',
			textTransform: 'uppercase',
			marginTop: size.s_20,
			marginBottom: size.s_10
		},
		sessionContent: {
			display: 'flex'
		},
		soundName: {
			fontSize: size.medium,
			color: colors.text,
			maxWidth: '80%',
			marginTop: size.s_6,
			textAlign: 'center'
		},
		wrapperIconLocked: {
			position: 'absolute',
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			left: 0,
			width: '100%',
			height: '100%',
			zIndex: 1
		},
		forSaleContainer: {
			flex: 1,
			backgroundColor: colors.secondary,
			justifyContent: 'center',
			alignItems: 'center'
		},
		forSaleText: {
			color: colors.textStrong,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		sessionHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_2
		},
		chevronIcon: {
			marginTop: size.s_10
		}
	});
