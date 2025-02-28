import { Attributes, Fonts, size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

const marginWidth = Dimensions.get('screen').width * 0.3;

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		backgroundStyle: {
			backgroundColor: colors.primary
		},

		header: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingBottom: size.s_10
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
			backgroundColor: colors.bgInputPrimary
		},
		container: {
			overflow: 'hidden',
			marginHorizontal: isTabletLandscape ? marginWidth : 0
		}
	});
