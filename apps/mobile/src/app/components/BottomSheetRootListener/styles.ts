import type { Attributes } from '@mezon/mobile-ui';
import { Fonts, size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

const marginWidth = Dimensions.get('screen').width * 0.3;

export const style = (colors: Attributes, themeBasic: string, isTabletLandscape: boolean) =>
	StyleSheet.create({
		backgroundStyle: {
			backgroundColor: colors.primary
		},

		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: size.s_10
		},

		section: {
			flex: 1
		},

		sectionTitle: {
			textAlign: 'center',
			color: colors.textStrong,
			fontWeight: 'bold',
			flexGrow: 1,
			flexBasis: 10,
			fontSize: Fonts.size.medium
		},

		titleSM: {},

		titleMD: {
			fontSize: Fonts.size.h6
		},

		titleLg: {},
		sectionRight: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-end'
		},

		sectionLeft: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'flex-start'
		},
		handleIndicator: {
			backgroundColor: themeBasic === 'light' || themeBasic === 'sunrise' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
			height: size.s_6,
			top: -size.s_6,
			marginTop: size.s_16,
			width: size.s_50,
			borderRadius: size.s_10,
			alignSelf: 'center'
		},
		container: {
			overflow: 'hidden',
			marginHorizontal: isTabletLandscape ? marginWidth : 0
		}
	});
