import { appActions, useAppDispatch } from '@mezon/store-mobile';
import { useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import WebView from 'react-native-webview';
import type {
	AndroidLayerType,
	ShouldStartLoadRequest,
	WebViewErrorEvent,
	WebViewMessageEvent,
	WebViewNavigationEvent
} from 'react-native-webview/lib/WebViewTypes';
import type { GestureResponderEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import ErrorPage from './ErrorPage';

interface webviewBaseComponentProps {
	url: string;
	javaScriptEnabled?: boolean;
	injectedJavaScript?: string;
	injectedJavaScriptBeforeContentLoaded?: string;
	incognito?: boolean;
	customErrorMessage?: string;
	domStorageEnabled?: boolean;
	nestedScrollEnabled?: boolean;
	setSupportMultipleWindows?: boolean;
	startInLoadingState?: boolean;
	androidLayerType?: AndroidLayerType;
	allowsInlineMediaPlayback?: boolean;
	allowsFullscreenVideo?: boolean;
	mediaPlaybackRequiresUserAction?: boolean;
	style?: StyleProp<ViewStyle>;
	onMessage?: (event: WebViewMessageEvent) => void;
	onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void;
	onLoadStart?: (event: WebViewNavigationEvent) => void;
	onError?: (error: WebViewErrorEvent) => void;
	onGoBack?: () => void;
	onRefresh?: () => void;
	onShouldStartLoadWithRequest?: (event: ShouldStartLoadRequest) => boolean;
	onStartShouldSetResponder?: (event: GestureResponderEvent) => boolean;
	onTouchStart?: (event: GestureResponderEvent) => void;
}

const WebviewBase = (props: webviewBaseComponentProps) => {
	const {
		url,
		javaScriptEnabled,
		injectedJavaScript,
		injectedJavaScriptBeforeContentLoaded,
		incognito,
		customErrorMessage,
		domStorageEnabled,
		nestedScrollEnabled,
		setSupportMultipleWindows,
		startInLoadingState,
		androidLayerType,
		allowsInlineMediaPlayback,
		allowsFullscreenVideo,
		mediaPlaybackRequiresUserAction,
		style,
		onMessage,
		onLoadEnd,
		onLoadStart,
		onError,
		onGoBack,
		onRefresh,
		onShouldStartLoadWithRequest,
		onStartShouldSetResponder,
		onTouchStart
	} = props;
	const [error, setError] = useState(null);
	const webviewRef = useRef<WebView>(null);
	const dispatch = useAppDispatch();

	const handleError = (error: WebViewErrorEvent) => {
		dispatch(appActions.setLoadingMainMobile(false));
		setError({ code: error?.nativeEvent?.code, description: error?.nativeEvent?.description });
		onError && onError(error);
	};

	const handleRefresh = () => {
		dispatch(appActions.setLoadingMainMobile(true));
		onRefresh && onRefresh();
		webviewRef?.current?.reload();
	};

	const handleLoadEnd = (event: WebViewNavigationEvent | WebViewErrorEvent) => {
		dispatch(appActions.setLoadingMainMobile(false));
		setError(null);
		onLoadEnd && onLoadEnd(event);
	};

	return (
		<View style={{ flex: 1 }}>
			{error && <ErrorPage error={error} onRefresh={handleRefresh} customErrorMessage={customErrorMessage} onGoBack={onGoBack} />}
			<WebView
				ref={webviewRef}
				source={{ uri: url }}
				javaScriptEnabled={javaScriptEnabled}
				injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
				injectedJavaScript={injectedJavaScript}
				setSupportMultipleWindows={setSupportMultipleWindows}
				incognito={incognito}
				domStorageEnabled={domStorageEnabled}
				nestedScrollEnabled={nestedScrollEnabled}
				startInLoadingState={startInLoadingState}
				androidLayerType={androidLayerType}
				allowsInlineMediaPlayback={allowsInlineMediaPlayback}
				allowsFullscreenVideo={allowsFullscreenVideo}
				mediaPlaybackRequiresUserAction={mediaPlaybackRequiresUserAction}
				style={style}
				onMessage={onMessage}
				onLoadEnd={onLoadEnd}
				onLoadStart={onLoadStart}
				onError={handleError}
				onLoad={handleLoadEnd}
				onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
				onStartShouldSetResponder={onStartShouldSetResponder}
				onTouchStart={onTouchStart}
			/>
		</View>
	);
};

export default WebviewBase;
