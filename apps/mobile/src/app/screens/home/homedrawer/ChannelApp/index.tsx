/* eslint-disable no-empty */
import { size, useTheme } from '@mezon/mobile-ui';
import { getAuthState } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Wave } from 'react-native-animated-spinkit';
import WebView from 'react-native-webview';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

const ChannelAppScreen = ({ navigation, route }) => {
	const { themeValue, themeBasic } = useTheme();
	const paramsRoute = route?.params;
	const styles = style(themeValue);
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const [loading, setLoading] = useState(true);
	const webviewRef = useRef<WebView>(null);
	const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
	const [isShowTooltip, setIsShowTooltip] = useState<boolean>(false);

	useEffect(() => {
		const handleOrientationChange = () => {
			const { width, height } = Dimensions.get('window');
			setOrientation(width > height ? 'Landscape' : 'Portrait');
		};
		const subscription = Dimensions.addEventListener('change', handleOrientationChange);

		handleOrientationChange();

		return () => {
			subscription?.remove();
		};
	}, []);

	const uri = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/apps-mobile/${paramsRoute?.clanId}/${paramsRoute?.channelId}`;
	const injectedJS = `
    (function() {
	const authData = {
		"loadingStatus":JSON.stringify("loaded"),
		"session": JSON.stringify(${session}),
		"isLogin": "true",
		"_persist": JSON.stringify({"version":-1,"rehydrated":true})
	};
    localStorage.setItem('persist:auth', JSON.stringify(authData));
    })();
	true;
	(function() {
		const persistApp = JSON.parse(localStorage.getItem('persist:apps'));
		if (persistApp) {
			persistApp.theme = JSON.stringify("${themeBasic}");
			persistApp.themeApp = JSON.stringify("${themeBasic}");
			localStorage.setItem('persist:apps', JSON.stringify(persistApp));
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
      \`;
      document.head.appendChild(style);
    })();
	true;
  `;

	const reloadChannelApp = () => {
		webviewRef?.current?.reload();
	};
	const onMessage = (event) => {
		console.error('Received message from WebView:', event?.nativeEvent?.data);
	};

	// const onPressOption = (option: IOption) => {
	// 	if (option?.value === OptionChannelApp.Refresh) {
	// 		reloadChannelApp();
	// 	}
	// 	setIsShowTooltip(false);
	// };

	// const toggleTooltip = () => {
	// 	setIsShowTooltip(!isShowTooltip);
	// };

	const onClose = () => {
		navigation.goBack();
	};

	return (
		<Modal style={styles.container} visible={true}>
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
			{/* <View style={styles.toolTipContainer}>
				<Tooltip
					isVisible={isShowTooltip}
					content={<ChannelAppOptions onPressOption={onPressOption} />}
					contentStyle={styles.toolTip}
					arrowSize={{ width: 0, height: 0 }}
					placement="center"
					onClose={() => setIsShowTooltip(false)}
					closeOnBackgroundInteraction={true}
					disableShadow={true}
					closeOnContentInteraction={true}
				>
					<TouchableOpacity onPress={toggleTooltip} style={styles.reloadButton}>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_16} width={size.s_16} />
						<MezonIconCDN icon={IconCDN.moreVerticalIcon} height={size.s_14} width={size.s_14} />
					</TouchableOpacity>
				</Tooltip>
			</View> */}

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
