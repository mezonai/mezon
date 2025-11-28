/* eslint-disable no-empty */
import { size, useTheme } from '@mezon/mobile-ui';
import { authActions, getAuthState, useAppDispatch } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Wave } from 'react-native-animated-spinkit';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../components/StatusBarHeight/StatusBarHeight';
import WebviewBase from '../../../../components/WebviewBase';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

const ChannelAppScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue, themeBasic } = useTheme();
	const dispatch = useAppDispatch();
	const paramsRoute = route?.params;
	const styles = style(themeValue);
	const { t } = useTranslation(['common']);
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const [loading, setLoading] = useState(true);
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
		try {
			const messageData = event?.nativeEvent?.data;
			const parsedMessage = safeJSONParse(messageData);
			if (parsedMessage?.type === 'mezon:session-refreshed' && parsedMessage?.data?.session) {
				dispatch(authActions.updateSession(parsedMessage.data.session));
			}
		} catch (error) {
			console.error('Non-JSON message received:', event?.nativeEvent?.data);
		}
	};

	const onClose = () => {
		navigation.goBack();
	};

	return (
		<Modal style={styles.container} visible={true} supportedOrientations={['portrait', 'landscape']}>
			{orientation === 'Portrait' && Platform.OS === 'ios' && <StatusBarHeight />}
			{loading && (
				<View style={styles.loadingContainer}>
					<Wave color={themeValue.text} />
					<Text style={styles.textLoading}>{t('loadingData')}</Text>
				</View>
			)}
			<TouchableOpacity onPress={onClose} style={styles.backButton}>
				<MezonIconCDN icon={IconCDN.closeSmallBold} height={size.s_16} width={size.s_16} />
				<Text style={styles.buttonText}>{t('close')}</Text>
			</TouchableOpacity>
			<WebviewBase
				url={uri}
				incognito={true}
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
				onRefresh={() => {
					setLoading(true);
				}}
				onGoBack={onClose}
			/>
		</Modal>
	);
};

export default ChannelAppScreen;
