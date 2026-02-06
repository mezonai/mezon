import { size } from '@mezon/mobile-ui';
import { appActions, selectHasInternetMobile } from '@mezon/store-mobile';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { NativeHttpClient } from '../../utils/NativeHttpClient';

export const fetchWithTimeout = async (url: string, timeout = 8000) => {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('Request timed out')), timeout);
	});

	try {
		const response = await Promise.race([NativeHttpClient.get(url), timeoutPromise]);
		return {
			ok: response.statusCode >= 200 && response.statusCode < 300,
			status: response.statusCode,
			body: response.body
		};
	} catch (error) {
		console.error('log  => error', error);
		throw error;
	}
};

const NetInfoComp = () => {
	const hasInternet = useSelector(selectHasInternetMobile);
	const dispatch = useDispatch();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const { t } = useTranslation(['common']);

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
			<MezonIconCDN icon={IconCDN.noSignalIcon} color={'white'} height={size.s_18} width={size.s_18} />
			<Text style={styles.text1}>{t('poorConnection')}</Text>
		</View>
	) : null;
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: size.s_10,
		gap: size.s_10,
		paddingVertical: size.s_8,
		position: 'absolute',
		zIndex: 110,
		top: Platform.OS === 'android' ? size.s_40 : size.s_60,
		marginHorizontal: 10,
		alignSelf: 'center',
		backgroundColor: 'rgba(63,69,75,0.89)',
		borderRadius: 10,
		elevation: 5, // Android shadow
		shadowColor: 'black', // iOS shadow
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4
	},
	text1: { textAlign: 'center', fontSize: size.medium, fontWeight: '600', color: 'white' }
});

export default NetInfoComp;
