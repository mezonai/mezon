import { useAuth } from '@mezon/core';
import { Colors, useTheme } from '@mezon/mobile-ui';
import { giveCoffeeActions, useAppDispatch, useAppSelector } from '@mezon/store';
import { selectAllChannelMembers, selectAppChannelById } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { style } from './styles';
const compareHost = (url1: string, url2: string) => {
	try {
		const parsedURL1 = new URL(url1);
		const parsedURL2 = new URL(url2);
		return parsedURL1.hostname === parsedURL2.hostname;
	} catch (error) {
		return false;
	}
};

const ChannelAppScreen = memo(({ channelId }: { channelId: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [loading, setLoading] = useState(true);
	const appChannel = useSelector(selectAppChannelById(channelId));
	const userChannels = useAppSelector((state) => selectAllChannelMembers(state, channelId));
	const webViewRef = useRef<WebView>();
	const currentUser = useAuth();
	const dispatch = useAppDispatch();

	const miniAppDataHash = useMemo(() => {
		return `userChannels=${JSON.stringify(userChannels)}`;
	}, [userChannels]);

	const onMessage = useCallback(
		(event: WebViewMessageEvent) => {
			const { data } = event.nativeEvent;
			const eventData = safeJSONParse(data ?? '{}');
			const origin = eventData.origin;

			if (appChannel?.url && compareHost(origin, appChannel?.url ?? '')) {
				console.log('[MEZON] < ', eventData);

				if (eventData?.eventType === 'PING') {
					webViewRef.current?.postMessage(JSON.stringify({ eventType: 'PONG', eventData: { message: 'PONG' } }));
					webViewRef.current?.postMessage(JSON.stringify({ eventType: 'CURRENT_USER_INFO', eventData: currentUser?.userProfile }));
				}

				if (eventData?.eventType === 'SEND_TOKEN') {
					const { amount, note, receiver_id, extra_attribute } = (eventData.eventData || {}) as any;
					const tokenEvent: ApiTokenSentEvent = {
						sender_id: currentUser.userId as string,
						sender_name: currentUser?.userProfile?.user?.username as string,
						receiver_id,
						amount,
						note,
						extra_attribute
					};
					dispatch(giveCoffeeActions.sendToken(tokenEvent))
						.unwrap()
						.then((response) => {
							webViewRef.current?.postMessage(JSON.stringify({ eventType: 'SEND_TOKEN_RESPONSE', eventData: response }));
						})
						.catch((err) => {
							console.error(err);
							webViewRef.current?.postMessage(JSON.stringify({ eventType: 'SEND_TOKEN_RESPONSE', eventData: err }));
						});
				}
			}
		},
		[appChannel?.url, currentUser, dispatch, webViewRef]
	);

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
			<StatusBar barStyle="light-content" backgroundColor={Colors.bgCharcoal} />
			{!!appChannel?.url && (
				<WebView
					ref={webViewRef}
					originWhitelist={['*']}
					source={{
						uri: appChannel?.url + `#${miniAppDataHash}`
					}}
					style={styles.container}
					mixedContentMode={'always'}
					onShouldStartLoadWithRequest={() => true}
					javaScriptEnabled={true}
					startInLoadingState={true}
					bounces={false}
					onMessage={onMessage}
					removeClippedSubviews={true}
					onLoadEnd={async () => {
						await sleep(500);
						setLoading(false);
					}}
				/>
			)}
		</View>
	);
});

export default ChannelAppScreen;
