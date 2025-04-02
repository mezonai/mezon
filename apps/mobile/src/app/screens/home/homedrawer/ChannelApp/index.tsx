/* eslint-disable no-empty */
import { useClans } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { getAuthState, selectAllAccount } from '@mezon/store-mobile';
import { MiniAppEventType, sleep } from '@mezon/utils';
import { useCallback, useRef, useState } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import WebView from 'react-native-webview';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

const ChannelAppScreen = ({ channelId }) => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const [loading, setLoading] = useState(true);
	const { currentClanId } = useClans();
	const userProfile = useSelector(selectAllAccount);
	const webviewRef = useRef<WebView>(null);

	const uri = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/clans/${currentClanId}/channels/${channelId}`;

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
      \`;
      document.head.appendChild(style);
    })();
	true;
	(function() {
	document.addEventListener('message', function(event) {
	  		if (event.data === 'onHandleLoadend') {
				setTimeout(() => {
				let element = document.querySelector("#mainChat > div > div > div.flex-shrink > div.flex.gap-2 > div:nth-child(1)");
				if (element) {
      element.click();
				window.ReactNativeWebView.postMessage(JSON.stringify({
					id: element.id,
					innerText: element.innerText,
					classList: Array.from(element.classList)
				}));
				} else {
      window.ReactNativeWebView.postMessage(JSON.stringify({ error: "Không tìm thấy #mainChat" }));
				}
			}, 1000);
			setTimeout(() => {
				const element = document.querySelector("#main-layout > div.relative > div.relative > div > div.flex > div > button:nth-child(2)");

				if (element && element.title === "Enter Full Screen") {
				element.click();
				window.ReactNativeWebView.postMessage(JSON.stringify({
					id: element.id,
					innerText: element.innerText,
					classList: Array.from(element.classList)
				}));
				} else {
      window.ReactNativeWebView.postMessage(JSON.stringify({ error: "Không tìm thấy #mainChat" }));
				}
			}, 2000);
			}
      });
	})();
	true;
  `;

	const handlePing = useCallback(() => {
		const message = JSON.stringify({ eventType: MiniAppEventType.CURRENT_USER_INFO, eventData: userProfile });
		webviewRef?.current?.postMessage(message);
		webviewRef?.current?.postMessage('onHandleLoadend');
	}, [userProfile]);

	const closeChannelApp = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const reloadChannelApp = () => {
		webviewRef?.current?.reload();
	};

	return (
		<View style={styles.container}>
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
					<Chase color={'#cdcdcd'} />
				</View>
			)}
			<View style={styles.topBar}>
				<TouchableOpacity onPress={closeChannelApp} style={styles.backButton}>
					<MezonIconCDN icon={IconCDN.closeLargeIcon} height={size.s_20} width={size.s_20} />
				</TouchableOpacity>
				<View style={styles.row}>
					<TouchableOpacity onPress={reloadChannelApp} style={styles.backButton}>
						<MezonIconCDN icon={IconCDN.reloadIcon} height={size.s_20} width={size.s_20} />
					</TouchableOpacity>
				</View>
			</View>
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
				nestedScrollEnabled={true}
				onLoadEnd={async () => {
					await sleep(1000);
					handlePing();
					await sleep(3000);
					setLoading(false);
				}}
			/>
		</View>
	);
};

export default ChannelAppScreen;
