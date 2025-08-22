/* eslint-disable no-empty */
import { size, useTheme } from '@mezon/mobile-ui';
import { getAuthState } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Wave } from 'react-native-animated-spinkit';
import WebView from 'react-native-webview';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

const ChannelAppScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue, themeBasic } = useTheme();
	const paramsRoute = route?.params;
	const styles = style(themeValue);
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const [loading, setLoading] = useState(true);
	const webviewRef = useRef<WebView>(null);
	const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');

	useEffect(() => {
		const handleOrientationChange = () => {
			const { width, height } = Dimensions.get('window');
			setOrientation(width > height ? 'Landscape' : 'Portrait');
		};
		const subscription = Platform.OS === 'ios' ? Dimensions.addEventListener('change', handleOrientationChange) : null;

		if (Platform.OS === 'ios') {
			handleOrientationChange();
		}

		return () => {
			subscription?.remove();
		};
	}, []);

	const uri = useMemo(() => {
		let queryString = '';
		if (paramsRoute?.code && paramsRoute?.subpath) {
			queryString = `?code=${paramsRoute?.code}&subpath=${paramsRoute?.subpath}`;
		} else if (paramsRoute?.code) {
			queryString = `?code=${paramsRoute?.code}`;
		} else if (paramsRoute?.subpath) {
			queryString = `?subpath=${paramsRoute?.subpath}`;
		}

		const baseUrl = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/apps-mobile/${paramsRoute?.clanId}/${paramsRoute?.channelId}`;

		return queryString ? `${baseUrl}${queryString}` : baseUrl;
	}, [paramsRoute?.channelId, paramsRoute?.clanId, paramsRoute?.code, paramsRoute?.subpath]);

	const mezon_session = JSON.stringify({
		host: process.env.NX_CHAT_APP_API_HOST as string,
		port: process.env.NX_CHAT_APP_API_PORT as string,
		ssl: true
	});

	const injectedJS = `
    (function() {
	const authData = {
		"loadingStatus":JSON.stringify("loaded"),
		"session": JSON.stringify(${session}),
		"isLogin": "true",
		"_persist": JSON.stringify({"version":-1,"rehydrated":true})
	};
    localStorage.setItem('persist:auth', JSON.stringify(authData));
	localStorage.setItem('mezon_session', JSON.stringify(${mezon_session}));
    })();
	true;
	(function() {
		try {
			const persistAppData = localStorage.getItem('persist:apps');
			if (persistAppData && typeof persistAppData === 'string') {
				const persistApp = JSON.parse(persistAppData);
				if (persistApp && typeof persistApp === 'object') {
					persistApp.theme = JSON.stringify("${themeBasic}");
					persistApp.themeApp = JSON.stringify("${themeBasic}");
					localStorage.setItem('persist:apps', JSON.stringify(persistApp));
					localStorage.setItem('current-theme', "${themeBasic}");
				}
			} else {
				throw new Error('persist:apps data is not a valid string');
			}
		} catch (error) {
			console.error('Error parsing persist:apps data:', error);
			// Create default app data if parsing fails
			const defaultAppData = {
				theme: JSON.stringify("${themeBasic}"),
				themeApp: JSON.stringify("${themeBasic}")
			};
			localStorage.setItem('persist:apps', JSON.stringify(defaultAppData));
			localStorage.setItem('current-theme', "${themeBasic}");
		}
	})();
	true;
  `;

	const injectedDataJS = `
   (function() {
      document.addEventListener('message', function(event) {
	  		window.ReactNativeWebView.postMessage(event.data);
          window.ReactNativeWebView.postMessage('Pong');
      });
    })();
	true;
	(function() {
      var style = document.createElement('style');
      style.innerHTML = \`
        .h-heightTopBar {
          display: none !important;
        }
        .footer-profile {
          display: none !important;
        }
       .contain-strict {
          display: none !important;
        }
        .bg-bgLightModeSecond {
        	padding-left: 0;
				}
				#clan-footer {
					display: none !important;
				}
				.h-dvh {
					padding-left: 0 !important;
				}
				#menu {
					display: none !important
				}
      \`;
      document.head.appendChild(style);
    })();
	true;
  `;

	const onMessage = (event: any) => {
		console.error('Received message from WebView:', event?.nativeEvent?.data);
	};

	const onClose = () => {
		navigation.goBack();
	};

	return (
		<Modal style={styles.container} visible={true} supportedOrientations={['portrait', 'landscape']}>
			{orientation === 'Portrait' && Platform.OS === 'ios' && <StatusBarHeight />}
			{loading && (
				<View
					style={{
						alignItems: 'center',
						justifyContent: 'center',
						position: 'absolute',
						height: '100%',
						zIndex: 1,
						width: '100%',
						backgroundColor: themeValue.primary,
						flex: 1
					}}
				>
					<Wave color={themeValue.text} />
					<Text style={styles.textLoading}>Loading data, please wait a moment!</Text>
				</View>
			)}
			<TouchableOpacity onPress={onClose} style={styles.backButton}>
				<MezonIconCDN icon={IconCDN.closeSmallBold} height={size.s_16} width={size.s_16} />
				<Text style={styles.buttonText}>Close</Text>
			</TouchableOpacity>

			<WebView
				ref={webviewRef}
				source={{
					uri: uri
				}}
				originWhitelist={['*']}
				style={styles.container}
				injectedJavaScriptBeforeContentLoaded={injectedJS}
				injectedJavaScript={injectedDataJS}
				javaScriptEnabled={true}
				onMessage={onMessage}
				nestedScrollEnabled={true}
				onLoadEnd={async () => {
					await sleep(500);
					setLoading(false);
				}}
			/>
		</Modal>
	);
};

export default ChannelAppScreen;
