import { Attributes, baseColor, size } from '@mezon/mobile-ui';
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
			paddingHorizontal: 20,
			paddingVertical: 16
		},
		headerTitle: {
			fontSize: 20,
			fontWeight: '700',
			color: colors.text
		},
		conversationsList: {
			paddingBottom: 20
		},
		conversationCard: {
			paddingHorizontal: 20,
			paddingVertical: 16,
			flexDirection: 'row',
			alignItems: 'center'
		},
		avatarContainer: {
			position: 'relative',
			marginRight: 16
		},
		avatar: {
			width: 50,
			height: 50,
			borderRadius: 25
		},
		onlineIndicator: {
			position: 'absolute',
			bottom: 2,
			right: 2,
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
			marginBottom: 4
		},
		userName: {
			fontSize: 16,
			fontWeight: '600',
			color: colors.text,
			flex: 1,
			marginRight: 8
		},
		timestamp: {
			fontSize: 12,
			color: colors.textDisabled,
			fontWeight: '500'
		},
		lastMessage: {
			fontSize: 14,
			color: colors.textDisabled,
			lineHeight: 20
		}
	});
