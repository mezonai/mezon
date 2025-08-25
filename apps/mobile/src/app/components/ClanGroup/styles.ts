/* eslint-disable prettier/prettier */
import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: Attributes) =>
	StyleSheet.create({
		expandedGroup: {
			backgroundColor: themeValue.midnightBlue,
			borderRadius: size.s_10,
			marginTop: size.s_10,
			marginHorizontal: size.s_4,
			paddingVertical: size.s_8
		},

		groupHeader: {
			alignSelf: 'center',
			alignItems: 'center',
			backgroundColor: themeValue.secondary,
			paddingVertical: size.s_10,
			width: size.s_42,
			height: size.s_42,
			borderRadius: size.s_42
		},

		clanContainer: {
			marginVertical: size.s_2
		},

		collapseIcon: {
			color: themeValue.text,
			fontSize: size.s_16
		},

		collapsedGroup: {
			alignItems: 'center',
			marginTop: size.s_10
		},

		groupIcon: {
			width: size.s_42,
			height: size.s_42,
			borderRadius: size.s_8,
			backgroundColor: themeValue.midnightBlue
		},

		clanIcon: {
			width: size.s_18,
			height: size.s_18,
			backgroundColor: themeValue.secondary,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 10
		},

		clanIconText: {
			color: themeValue.text,
			fontSize: size.s_12
		},

		multipleClansView: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			width: '100%',
			height: '100%',
			justifyContent: 'space-around',
			alignItems: 'center'
		},

		singleClanView: {
			justifyContent: 'flex-start'
		},

		quarterClan: {
			width: '40%',
			height: '40%',
			margin: size.s_2
		},

		removeButton: {
			position: 'absolute',
			top: size.s_6,
			right: size.s_6,
			backgroundColor: themeValue.primary,
			borderRadius: 20,
			width: size.s_18,
			height: size.s_18,
			justifyContent: 'center',
			alignItems: 'center'
		},

		badge: {
			backgroundColor: baseColor.redStrong,
			position: 'absolute',
			borderRadius: 20,
			borderWidth: size.s_2,
			borderColor: themeValue.secondary,
			minWidth: size.s_20,
			height: size.s_20,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -5,
			right: -5
		},

		badgeText: {
			color: baseColor.white,
			fontWeight: 'bold',
			fontSize: size.s_10
		}
	});
