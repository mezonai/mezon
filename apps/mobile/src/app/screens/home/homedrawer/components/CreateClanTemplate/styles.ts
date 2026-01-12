import type { Attributes } from '@mezon/mobile-ui';
import { Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			width: '100%',
			height: '100%',
			paddingHorizontal: size.s_20
		},
		contentContainer: {
			padding: Metrics.size.l,
			paddingBottom: Metrics.size.xxxl
		},
		headerContainer: {
			alignItems: 'center',
			marginTop: size.s_20,
			marginBottom: Metrics.size.xl
		},
		title: {
			fontSize: Fonts.size.h4,
			fontWeight: '700',
			color: colors.textStrong,
			marginBottom: size.s_10,
			textAlign: 'center'
		},
		description: {
			fontSize: Fonts.size.medium,
			color: colors.textDisabled,
			fontWeight: '500',
			textAlign: 'center'
		},
		section: {
			marginBottom: Metrics.size.l
		},
		sectionTitle: {
			fontSize: Fonts.size.small,
			fontWeight: 'bold',
			color: colors.text,
			marginBottom: Metrics.size.s,
			textTransform: 'uppercase'
		},
		listContainer: {
			gap: Metrics.size.s
		},
		menuItem: {
			backgroundColor: colors.primaryGradiant,
			borderRadius: size.s_8,
			borderWidth: 1,
			borderColor: colors.border,
			paddingVertical: Metrics.size.m,
			paddingHorizontal: Metrics.size.m
		},
		menuItemText: {
			fontWeight: '600',
			fontSize: Fonts.size.medium
		},
		backButton: {
			position: 'absolute',
			left: -size.s_16,
			top: -size.s_10,
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: 10,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20
		}
	});
