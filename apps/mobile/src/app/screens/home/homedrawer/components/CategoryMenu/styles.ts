import { Attributes, Fonts, Metrics, baseColor } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = ({ textStrong }: Attributes) =>
	StyleSheet.create({
		avatarWrapper: {
			width: 60,
			height: 60,
			backgroundColor: baseColor.blurple,
			borderRadius: 10,
			overflow: 'hidden'
		},

		serverName: {
			color: textStrong,
			fontSize: Fonts.size.h7,
			fontWeight: '700'
		},

		header: {
			gap: Metrics.size.l,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			marginBottom: Metrics.size.xxxl
		},

		container: {
			flex: 1,
			padding: Metrics.size.xl,
			paddingTop: 0
		}
	});
