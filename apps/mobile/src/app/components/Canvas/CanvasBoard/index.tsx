import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { getAuthState } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { APP_SCREEN, MenuChannelScreenProps } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type ScreenChannelCanvas = typeof APP_SCREEN.MENU_CHANNEL.CANVAS;
export function CanvasScreen({ route }: MenuChannelScreenProps<ScreenChannelCanvas>) {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const { clanId, channelId, canvasId } = route.params;
	const authState = useSelector(getAuthState);
	const session = JSON.stringify(authState.session);
	const [loading, setLoading] = useState(true);

	const uri = `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/canvas-mobile/${clanId}/${channelId}/${canvasId}`;

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
			<StatusBar barStyle={themeBasic === ThemeModeBase.LIGHT ? 'dark-content' : 'light-content'} backgroundColor={themeValue.charcoal} />
			<WebView
				source={{
					uri: uri
				}}
				style={styles.container}
				injectedJavaScriptBeforeContentLoaded={injectedJS}
				javaScriptEnabled={true}
				nestedScrollEnabled={true}
				onLoadEnd={async () => {
					await sleep(500);
					setLoading(false);
				}}
			/>
		</View>
	);
}
