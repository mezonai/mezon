import { baseColor, size } from '@mezon/mobile-ui';
import { appActions, selectHasInternetMobile } from '@mezon/store-mobile';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useRef } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const NetInfoComp = () => {
	const hasInternet = useSelector(selectHasInternetMobile);
	const dispatch = useDispatch();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const fetchWithTimeout = async (url, timeout = 8000) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(url, {
				cache: 'no-cache',
				signal: controller.signal
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			console.error('log  => error', error);
			clearTimeout(timeoutId);
			if (error.name === 'AbortError') {
				throw new Error('Request timed out');
			}
			throw error;
		}
	};
	const checkConnectionQuality = async () => {
		try {
			const startTime = Date.now();
			const response = await fetchWithTimeout(`${process.env.NX_CHAT_APP_REDIRECT_URI}/favicon.ico`, 8000);

			if (!response.ok) {
				dispatch(appActions.setHasInternetMobile(false));
				return false;
			}

			// Calculate response time
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			// If response time is too high (e.g., > 3 seconds), consider it a poor connection
			if (responseTime > 8000) {
				dispatch(appActions.setHasInternetMobile(false));
				return false;
			}
			timeoutRef?.current && clearInterval(timeoutRef.current);
			dispatch(appActions.setHasInternetMobile(true));
			return true;
		} catch (error) {
			dispatch(appActions.setHasInternetMobile(false));
			console.error('log  => error checkConnectionQuality', error);
			return false;
		}
	};

	const checkInitConnection = async () => {
		const isCheckConnect = await checkConnectionQuality();
		if (!isCheckConnect) {
			timeoutRef.current = setInterval(async () => {
				await checkConnectionQuality();
			}, 8000);
		}
	};

	const handleAppStateChangeListener = async (nextAppState: string) => {
		if (nextAppState === 'active') {
			const state = await NetInfo.fetch();
			dispatch(appActions.setHasInternetMobile(state.isConnected));
			await checkInitConnection();
		}
	};

	useEffect(() => {
		checkInitConnection();
		AppState.addEventListener('change', handleAppStateChangeListener);
		NetInfo.addEventListener((state) => {
			dispatch(appActions.setHasInternetMobile(state.isConnected));
		});
	}, []);

	return !hasInternet ? (
		<View style={styles.container}>
			<Text style={styles.text1}>No internet connection</Text>
			<Text numberOfLines={2} style={styles.text2}>
				Please check your connection or restart the app and try again
			</Text>
		</View>
	) : null;
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		paddingVertical: 15,
		position: 'absolute',
		zIndex: 10,
		top: 60,
		marginHorizontal: 10,
		alignSelf: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.93)',
		borderRadius: 10,
		elevation: 5, // Android shadow
		shadowColor: 'black', // iOS shadow
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		borderStartWidth: 5,
		borderColor: baseColor.redStrong
	},
	text1: { textAlign: 'left', fontSize: size.medium, fontWeight: 'bold', marginBottom: 5, color: 'black' },
	text2: { textAlign: 'left', fontSize: size.small, fontWeight: '500', color: 'grey' }
});

export default NetInfoComp;
