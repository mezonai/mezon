import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingVertical: size.s_100,
			paddingHorizontal: size.s_20
		},
		headerCall: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: size.s_20
		},
		callerName: {
			fontSize: size.s_24,
			fontWeight: 'bold',
			marginVertical: size.s_10,
			color: 'white',
			textAlign: 'center'
		},
		callerInfo: {
			top: -size.s_14,
			fontSize: size.s_16,
			marginVertical: size.s_10,
			color: '#d8d8d8',
			textAlign: 'center'
		},
		callerImage: {
			width: size.s_150,
			height: size.s_150,
			borderRadius: size.s_150
		},
		buttonContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			width: '85%'
		},
		button: {
			flex: 1,
			alignItems: 'center',
			marginHorizontal: size.s_150
		},
		deniedCall: { width: size.s_70, height: size.s_70 },
		answerCall: { width: size.s_100, height: size.s_100 },
		wrapperConnecting: {
			justifyContent: 'space-between',
			gap: size.s_20,
			alignItems: 'center'
		}
	});
