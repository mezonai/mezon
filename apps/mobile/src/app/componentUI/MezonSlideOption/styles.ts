import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		boxBorder: {
			borderRadius: 15,
			backgroundColor: 'transparent',
			borderColor: baseColor.blurple,
			borderWidth: 2
		},

		boxSelect: {
			width: '100%',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center'
		},

		selectList: {
			gap: 9.7,
			alignItems: 'center'
		},
		selectListWrapper: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			zIndex: 1000
		},

		title: {
			textAlign: 'center',
			fontWeight: '600',
			fontSize: size.s_14,
			color: colors.text,
			marginVertical: size.s_20
		},
		desc: {
			textAlign: 'center',
			fontSize: size.s_14,
			color: colors.textDisabled,
			marginTop: size.s_20
		},
		containerConversation: {
			margin: size.s_10,
			borderWidth: 1,
			borderColor: colors.secondary,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 3
			},
			shadowOpacity: 0.27,
			shadowRadius: 4.65,

			elevation: 6
		},
		header: {
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_16
		},
		headerTitle: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: colors.text
		},
		conversationsList: {
			paddingBottom: size.s_20
		},
		conversationCard: {
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_12,
			flexDirection: 'row',
			alignItems: 'center'
		},
		avatarContainer: {
			position: 'relative',
			marginRight: size.s_16
		},
		avatar: {
			width: size.s_48,
			height: size.s_48,
			borderRadius: size.s_48
		},
		onlineIndicator: {
			position: 'absolute',
			bottom: size.s_2,
			right: size.s_2,
			width: 14,
			height: 14,
			borderRadius: 7,
			backgroundColor: '#28a745',
			borderWidth: 2,
			borderColor: '#ffffff'
		},
		conversationContent: {
			flex: 1,
			justifyContent: 'center'
		},
		conversationHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: size.s_4
		},
		userName: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: colors.text,
			flex: 1,
			marginRight: size.s_8
		},
		timestamp: {
			fontSize: size.s_10,
			color: colors.textDisabled,
			fontWeight: '500'
		},
		lastMessage: {
			fontSize: size.s_12,
			color: colors.textDisabled,
			lineHeight: 20
		}
	});
