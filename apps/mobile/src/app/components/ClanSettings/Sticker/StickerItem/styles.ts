import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { width } from 'libs/mobile-ui/src/lib/themes/Metrics';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			backgroundColor: colors.primary,
			paddingBottom: size.s_2,
			marginBottom: size.s_12,
			borderBottomColor: colors.border,
			borderBottomWidth: 1,
			paddingHorizontal: size.s_20,
			gap: size.s_10,
			height: size.s_50
		},
		flexRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},
		stickerName: {
			maxWidth: width * 0.3,
			flexDirection: 'row',
			alignItems: 'center',
			width: 'auto'
		},
		text: {
			color: colors.borderRadio,
			fontSize: size.s_12,
			maxWidth: '75%'
		},
		lightTitle: {
			color: colors.white,
			fontSize: size.s_14
		},
		close: {
			height: '100%',
			padding: size.s_10,
			justifyContent: 'center',
			alignItems: 'center'
		},
		rightItem: {
			backgroundColor: baseColor.flamingo,
			paddingHorizontal: size.s_15,
			justifyContent: 'center',
			alignItems: 'center',
			paddingVertical: size.s_15
		},
		deleteButton: {
			justifyContent: 'center',
			alignItems: 'center'
		},
		deleteText: {
			color: 'white',
			fontWeight: 'bold',
			fontSize: size.s_14
		},
		wrapperForSale: {
			position: 'absolute',
			alignItems: 'center',
			justifyContent: 'center',
			left: size.s_4,
			bottom: 0,
			transform: 'rotate(320deg)',
			width: size.s_24,
			borderWidth: 1,
			borderColor: 'yellow',
			borderRadius: size.s_20,
			height: size.s_24,
			zIndex: 1,
			backgroundColor: colors.primary
		}
	});
