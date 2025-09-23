import { Attributes, size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

export const style = (colors: Attributes, widthImage: number) =>
	StyleSheet.create({
		container: {
			width: Dimensions.get('screen').width,
			paddingHorizontal: size.s_10,
			borderTopRightRadius: size.s_18,
			borderTopLeftRadius: size.s_18,
			overflow: 'hidden',
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: size.s_6
		},
		overlay: {
			position: 'absolute',
			alignItems: 'center',
			justifyContent: 'center',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(000,000,000,0.8)'
		},
		wrapper: { height: '100%' },
		contentContainer: {
			paddingBottom: size.s_50,
			justifyContent: 'flex-start',
			alignItems: 'center',
			flexGrow: 1
		},
		sectionHeader: {
			padding: size.s_10,
			backgroundColor: colors.primary,
			width: Dimensions.get('screen').width
		},
		sectionYearHeaderTitle: {
			color: colors.textStrong,
			fontSize: 16,
			fontWeight: '700',
			marginBottom: size.s_4
		},
		sectionDayHeaderTitle: {
			color: colors.text,
			fontSize: 14,
			fontWeight: '600'
		},
		rowContainer: {
			flexDirection: 'row',
			width: Dimensions.get('screen').width,
			paddingHorizontal: size.s_8
		},
		rowItem: {
			height: widthImage,
			width: widthImage,
			margin: size.s_4
		}
	});
