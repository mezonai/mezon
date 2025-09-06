import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		createChannelContainer: {
			backgroundColor: colors.primary,
			height: '100%',
			width: '100%',
			position: 'relative'
		},
		createChannelContent: {
			flex: 1,
			width: '100%'
		},
		createChannelIcon: {
			height: 60,
			width: 60,
			backgroundColor: '#313338',
			borderRadius: 50,
			marginBottom: 10
		},
		threadName: {
			fontSize: 16,
			lineHeight: 1.25 * 16,
			fontWeight: '600',
			color: '#f1f2f4',
			marginBottom: 5
		},
		threadPolicy: {
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			padding: 10,
			gap: 20
		},
		threadPolicyTitle: {
			fontSize: 16,
			lineHeight: 1.25 * 16,
			fontWeight: '600',
			color: colors.textStrong
		},
		threadPolicyContent: {
			fontSize: 16,
			lineHeight: 1.25 * 16,
			fontWeight: '400',
			color: colors.text
		},
		inputThreadName: {
			borderRadius: 6,
			backgroundColor: '#1e1f22',
			borderColor: '#43464b',
			borderWidth: 1,
			fontSize: size.label,
			fontWeight: '500',
			color: 'white',
			paddingHorizontal: size.s_10,
			height: size.s_40,
			paddingVertical: 0
		},
		inputContainer: {
			marginBottom: size.s_20
		},
		threadPolicyInfo: {
			flex: 1
		},
		iconContainer: {
			width: 50,
			height: 50,
			borderRadius: 50,
			backgroundColor: colors.secondary,
			marginBottom: 16,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center'
		},
		messageBox: {
			borderTopColor: '#676b73',
			borderBottomColor: '#676b73',
			borderTopWidth: 0.5,
			borderBottomWidth: 0.5,
			paddingTop: size.s_20,
			paddingBottom: size.s_20
		},
		errorMessage: { paddingRight: size.s_20 },
		scrollview: {
			flexGrow: 1,
			justifyContent: 'space-between'
		}
	});
