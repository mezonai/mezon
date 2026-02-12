import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (widthWebview: number, heightWebview: number, isLoading: boolean) =>
	StyleSheet.create({
		webviewContainer: {
			width: widthWebview,
			height: heightWebview
		},
		webviewLoading: {
			opacity: isLoading ? 0 : 1
		},
		loadingSpinner: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0,0,0,0.1)',
			justifyContent: 'center',
			alignItems: 'center'
		},
		borderLeftView: {
			marginTop: size.s_6,
			borderLeftWidth: size.s_2,
			borderRadius: size.s_4
		}
	});
