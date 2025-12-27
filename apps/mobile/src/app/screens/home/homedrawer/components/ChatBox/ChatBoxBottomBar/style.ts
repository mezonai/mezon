import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
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
			overflow: 'hidden',
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
			paddingTop: Platform.OS === 'ios' ? size.s_12 : size.s_10,
			paddingBottom: size.s_12,
			backgroundColor: colors.tertiary,
			color: colors.textStrong,
			textAlignVertical: 'center'
		},
		inputStyleEmpty: {
			height: size.s_40,
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
		},
		pasteTooltip: {
			position: 'absolute',
			bottom: size.s_50,
			left: 0,
			zIndex: 1000,
			shadowColor: baseColor.black,
			shadowOffset: {
				width: 0,
				height: 12
			},
			shadowOpacity: 0.58,
			shadowRadius: 16.0,
			elevation: 24
		},
		tooltipContent: {
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_8,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: size.s_36
		},
		tooltipText: {
			color: colors.textStrong,
			fontSize: size.small,
			fontWeight: '500'
		},
		tooltipArrow: {
			position: 'absolute',
			bottom: -size.s_6,
			left: '50%',
			marginLeft: -size.s_6,
			width: 0,
			height: 0,
			borderLeftWidth: size.s_6,
			borderRightWidth: size.s_6,
			borderTopWidth: size.s_6,
			borderLeftColor: 'transparent',
			borderRightColor: 'transparent',
			borderTopColor: colors.secondaryLight
		},
		recordingProcessing: {
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_10,
			position: 'absolute',
			flexDirection: 'row',
			zIndex: 10,
			height: size.s_70,
			gap: size.s_40,
			left: 0,
			right: 0
		},
		micIconContainer: {
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_50,
			backgroundColor: 'rgba(255, 0, 0, 0.1)',
			justifyContent: 'center',
			alignItems: 'center'
		},
		timerText: {
			fontSize: size.s_16,
			color: colors.text,
			fontWeight: '600'
		},
		wrapperMicrophone: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8
		},
		wrapperSlideToCancel: {
			flexDirection: 'row',
			alignItems: 'center'
		}
	});
