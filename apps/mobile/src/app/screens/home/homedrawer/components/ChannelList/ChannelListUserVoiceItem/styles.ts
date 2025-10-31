import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		userVoiceWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			marginLeft: size.s_30,
			paddingVertical: size.s_6
		},

		userVoiceName: {
			color: colors.text,
			fontSize: size.h85,
			fontWeight: '400'
		},
		titleNumberMem: {
			color: colors.text,
			fontWeight: 'bold',
			fontSize: size.s_10,
			flexShrink: 1
		},
		collapsedAvatar: {
			// left offset will be dynamic based on index
		},
		collapsedCountBadge: {
			paddingHorizontal: size.s_2,
			minWidth: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			borderWidth: 1,
			alignItems: 'center',
			justifyContent: 'center'
		}
	});
