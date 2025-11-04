import { Attributes, Fonts, Metrics, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = ({ textStrong }: Attributes) =>
	StyleSheet.create({
		avatarWrapper: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_10,
			overflow: 'hidden'
		},

		serverName: {
			color: textStrong,
			fontSize: Fonts.size.medium,
			fontWeight: '700',
			maxWidth: '75%'
		},

		header: {
			gap: Metrics.size.l,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			marginBottom: Metrics.size.xxxl
		},

		container: {
			padding: Metrics.size.xl,
			paddingTop: 0
		},
		flexOne: {
			flex: 1
		}
	});
