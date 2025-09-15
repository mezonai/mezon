import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: size.s_2,
			overflow: 'visible'
		},
		wrapper: {
			flexDirection: 'row',
			zIndex: 10
		},
		btnIcon: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.tertiary
		},
		wrapperInput: {
			position: 'relative',
			justifyContent: 'center',
			borderRadius: size.s_22
		},
		iconEmoji: {
			position: 'absolute',
			right: 10
		},
		iconSend: {
			marginLeft: size.s_6,
			backgroundColor: baseColor.blurple
		},
		iconVoice: {
			marginLeft: size.s_6
		},
		iconAnonymous: {
			position: 'absolute',
			top: -size.s_10,
			right: -size.s_10,
			transform: [{ rotate: '45deg' }]
		},
		containerInput: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingBottom: size.s_20,
			paddingTop: size.s_10,
			paddingLeft: size.s_4
		},
		inputWrapper: {
			position: 'relative',
			flex: 1,
			flexDirection: 'row',
			paddingHorizontal: size.s_6
		},
		input: {
			alignItems: 'center',
			flex: 1,
			justifyContent: 'center'
		},
		inputStyle: {
			maxHeight: size.s_40 * 3,
			width: '100%',
			borderBottomWidth: 0,
			borderRadius: size.s_20,
			paddingLeft: Platform.OS === 'ios' ? size.s_16 : size.s_20,
			paddingRight: size.s_40,
			fontSize: size.medium,
			paddingTop: Platform.OS === 'ios' ? size.s_10 : size.s_8,
			paddingBottom: size.s_12,
			backgroundColor: colors.tertiary,
			color: colors.textStrong,
			textAlignVertical: 'center'
		},
		suggestions: {
			position: 'absolute',
			bottom: size.s_70 + size.s_4,
			left: 0,
			right: 0,
			maxHeight: size.s_615,
			backgroundColor: Platform.OS === 'android' ? 'transparent' : colors.primary,
			borderTopColor: colors.secondaryLight,
			borderRadius: size.s_8,
			overflow: 'hidden',
			zIndex: 10
		}
	});
