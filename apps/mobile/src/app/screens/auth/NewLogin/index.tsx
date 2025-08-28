import { useAuth } from '@mezon/core';
import { remove, save, STORAGE_MY_USER_ID, STORAGE_SESSION_KEY } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { accountActions, appActions, clansActions, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { sleep } from '@mezon/utils';
import * as Sentry from '@sentry/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import WebView from 'react-native-webview';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { style } from './styles';

const NewLoginScreen = () => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const OAUTH2_AUTHORIZE_URL = process.env.NX_CHAT_APP_OAUTH2_AUTHORIZE_URL;
	const CLIENT_ID = process.env.NX_CHAT_APP_OAUTH2_CLIENT_ID;
	const REDIRECT_URI = encodeURIComponent(process.env.NX_CHAT_APP_OAUTH2_REDIRECT_URI as string);
	const RESPONSE_TYPE = process.env.NX_CHAT_APP_OAUTH2_RESPONSE_TYPE;
	const SCOPE = process.env.NX_CHAT_APP_OAUTH2_SCOPE;
	const STATE = useMemo(() => {
		return Math.random().toString(36).substring(2, 15);
	}, []);
	const [authUri, setAuthUri] = useState(null);
	const { loginByEmail } = useAuth();
	const dispatch = useAppDispatch();
	const { clientRef } = useMezon();
	const haveSentOTPRef = useRef<boolean>(false);

	useEffect(() => {
		haveSentOTPRef.current = false;
		remove(STORAGE_SESSION_KEY);
		const authUrl = `${OAUTH2_AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&state=${STATE}`;
		setAuthUri(authUrl);
	}, [OAUTH2_AUTHORIZE_URL, RESPONSE_TYPE, SCOPE, STATE]);

	const handleLoginEmail = async (code: string) => {
		if (code) {
			haveSentOTPRef.current = true;
			dispatch(appActions.setLoadingMainMobile(true));
			try {
				const res: any = await loginByEmail(code);
				if (res === 'Invalid session') {
					Toast.show({
						type: 'error',
						text1: 'Login Failed',
						text2: 'Invalid email or password'
					});
					dispatch(accountActions.setAccount(null));
				}
				if (res?.user_id) {
					save(STORAGE_MY_USER_ID, res?.user_id?.toString());
					dispatch(clansActions.loadUserClanGroups({ userId: res?.user_id?.toString() }));
				}
				dispatch(appActions.setLoadingMainMobile(false));
			} catch (error) {
				dispatch(appActions.setLoadingMainMobile(false));
			}
			return false;
		}
	};

	const handleShouldNavigationStateChange = (newNavState) => {
		if (newNavState?.url?.includes('code') && newNavState?.url?.includes('state')) {
			const code = new URLSearchParams(newNavState?.url?.split('?')[1]).get('code');
			if (code) {
				handleLoginEmail(code);
				return false;
			}
		}
		return true;
	};

	const onLoadEndWebView = async () => {
		await sleep(2000);
		if (clientRef?.current && clientRef?.current?.host !== process.env.NX_CHAT_APP_API_GW_HOST && !haveSentOTPRef?.current) {
			clientRef.current.setBasePath(process.env.NX_CHAT_APP_API_GW_HOST, process.env.NX_CHAT_APP_API_GW_PORT, true);
		}
	};

	return (
		<View style={styles.supperContainer}>
			{authUri && (
				<View style={styles.webView}>
					<WebView
						incognito={true}
						originWhitelist={['*']}
						style={styles.supperContainer}
						source={{ uri: authUri }}
						onShouldStartLoadWithRequest={handleShouldNavigationStateChange}
						startInLoadingState={true}
						onError={(error) => {
							Sentry.captureException('WebviewLogin', { extra: { error } });
						}}
						domStorageEnabled={true}
						iosTimeoutInMilliseconds={120000}
						androidTimeoutInMilliseconds={120000}
						onLoadEnd={onLoadEndWebView}
					/>
				</View>
			)}
		</View>
	);
};

export default NewLoginScreen;
