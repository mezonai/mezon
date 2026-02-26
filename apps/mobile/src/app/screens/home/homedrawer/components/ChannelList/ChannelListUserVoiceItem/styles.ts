import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, index: number) =>
	StyleSheet.create({
		userVoiceWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			marginLeft: size.s_40,
			paddingVertical: size.s_4
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
		collapsedCountBadge: {
			paddingHorizontal: size.s_2,
			minWidth: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			borderWidth: 1,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.primary,
			borderColor: colors.text
		},
		collapsedAvatar: {
			left: -size.s_4 * index
		},
		collapsedAvatarImage: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_20,
			overflow: 'hidden'
		}
	});
