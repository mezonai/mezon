import { IS_TABLET } from '@mezon/mobile-components';
import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape?: boolean) =>
	StyleSheet.create({
		supperContainer: {
			flex: 1,
			backgroundColor: colors.primary,
			justifyContent: 'center'
		},
		headerContainer: {
			alignItems: 'center',
			marginTop: size.s_30,
			marginBottom: IS_TABLET ? size.s_10 : size.s_30,
			paddingVertical: Metrics.size.m,
			paddingHorizontal: Metrics.size.xl
		},
		headerTitle: {
			fontSize: isTabletLandscape ? size.s_40 : size.s_34,
			textAlign: 'center',
			fontWeight: 'bold',
			color: colors.textStrong
		},
		headerContent: {
			fontSize: isTabletLandscape ? size.s_18 : size.s_14,
			lineHeight: isTabletLandscape ? size.s_18 : size.s_14,
			textAlign: 'center',
			color: colors.text
		},
		button: {
			backgroundColor: baseColor.blurple,
			marginHorizontal: size.s_20,
			borderRadius: size.s_8,
			height: size.s_50,
			justifyContent: 'center',
			alignItems: 'center'
		},
		buttonText: {
			fontSize: size.medium,
			color: baseColor.white
		},
		modal: {
			justifyContent: 'center',
			alignItems: 'center'
		},
		modalView: {
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		webView: {
			height: '60%',
			width: '90%'
		}
	});
