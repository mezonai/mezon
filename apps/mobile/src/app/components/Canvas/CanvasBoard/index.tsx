import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { getAuthState } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import { useSelector } from 'react-redux';
import { APP_SCREEN, MenuChannelScreenProps } from '../../../navigation/ScreenTypes';
import WebviewBase from '../../WebviewBase';
import { style } from './styles';

type ScreenChannelCanvas = typeof APP_SCREEN.MENU_CHANNEL.CANVAS;
export function CanvasScreen({ navigation, route }: MenuChannelScreenProps<ScreenChannelCanvas>) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const { clanId, channelId, canvasId } = route.params;
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const [loading, setLoading] = useState(true);

	const uri = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/canvas-mobile/${clanId}/${channelId}/${canvasId}`;

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
      var style = document.createElement('style');
      style.innerHTML = \`
        .h-heightTopBar {
          display: none !important;
        }
		.w-[72px] {
		width: 72px;
		display: none;
		}
      \`;
      document.head.appendChild(style);
    })();
	true;
  `;

	const onMessage = (event: any) => {
		console.error('Received message from WebView:', event?.nativeEvent?.data);
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
						backgroundColor: themeValue.charcoal,
						flex: 1
					}}
				>
					<Chase color={'#cdcdcd'} />
				</View>
			)}
			<StatusBar
				barStyle={themeBasic === ThemeModeBase.LIGHT || themeBasic === ThemeModeBase.SUNRISE ? 'dark-content' : 'light-content'}
				backgroundColor={themeValue?.primaryGradiant || themeValue.charcoal}
			/>
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
					await sleep(1000);
					setLoading(false);
				}}
				onGoBack={() => navigation.goBack()}
			/>
		</View>
	);
}
