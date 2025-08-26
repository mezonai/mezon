import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		reportMessageModalContainer: {
			gap: size.s_18,
			flex: 1,
			justifyContent: 'space-between'
		},
		cancelButtonWrapper: {
			borderTopWidth: 1,
			borderTopColor: colors.borderDim
		},
		buttonWrapper: {
			paddingBottom: size.s_30,
			borderTopWidth: 1,
			borderTopColor: colors.borderDim
		},
		cannelText: {
			paddingVertical: size.s_18,
			color: colors.white,
			textAlign: 'center'
		},
		SubmitButton: {
			margin: size.s_10,
			backgroundColor: baseColor.redStrong,
			borderRadius: size.s_4
		},
		SubmitText: {
			paddingVertical: size.s_10,
			color: 'white',
			textAlign: 'center'
		},
		messageBox: {
			paddingTop: size.s_10,
			paddingBottom: size.s_6,
			borderRadius: size.s_4,
			borderWidth: 1,
			borderColor: colors.borderDim
		},
		selectedMessageText: {
			color: colors.textStrong,
			marginBottom: size.s_10
		},
		contentWrapper: {
			marginHorizontal: size.s_10
		},
		reportItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			backgroundColor: colors.bgInputPrimary,
			padding: size.s_14,
			borderRadius: size.s_8
		},
		reportTitle: {
			color: colors.white
		},
		reportList: {
			marginTop: size.s_10
		},
		title: {
			color: colors.white,
			fontSize: size.h4,
			textAlign: 'center'
		},
		subTitle: {
			color: colors.textStrong,
			textAlign: 'center',
			paddingHorizontal: size.s_14
		},
		reportCategory: {
			color: colors.textStrong
		},
		reportCategoryTitle: {
			color: colors.white
		},
		reportCategoryWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8
		},
		categoryTitle: {
			marginVertical: 20,
			gap: size.s_10
		}
	});
