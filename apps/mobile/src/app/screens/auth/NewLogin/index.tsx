import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer as BufferMobile } from 'buffer';
import CryptoJS from 'crypto-js';
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import WebView from 'react-native-webview';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { style } from './styles';

export const generateCodeVerifier = () => {
	const array = new Uint8Array(64);
	for (let i = 0; i < 64; i++) {
		array[i] = Math.floor(Math.random() * 256);
	}
	return BufferMobile.from(array).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

export const generateCodeChallenge = (verifier) => {
	const sha256Hash = CryptoJS.SHA256(verifier);
	return CryptoJS.enc.Base64.stringify(sha256Hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const NewLoginScreen = () => {
	const { themeValue } = useTheme();
	const isTabletLandscape = useTabletLandscape();
	const styles = style(themeValue, isTabletLandscape);
	const OAUTH2_AUTHORIZE_URL = 'https://oauth2.mezon.ai/oauth2/auth';
	const CLIENT_ID = '91818787-2db6-4638-b463-06989b4fe00c';
	const REDIRECT_URI = 'http://localhost:4200/login/callback';
	const RESPONSE_TYPE = 'code';
	const SCOPE = encodeURIComponent('openid offline');
	const CODE_CHALLENGE_METHOD = 'S256';
	const STATE = useMemo(() => {
		const randomState = Math.random().toString(36).substring(2, 15);
		AsyncStorage.setItem('oauth_state', randomState);
		return randomState;
	}, []);
	const [authUri, setAuthUri] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);

	const handleLogin = async () => {
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		AsyncStorage.setItem('code_verifier', codeVerifier);

		const authUrl = `${OAUTH2_AUTHORIZE_URL}?client_id=${CLIENT_ID}&prompt=consent&response_type=${RESPONSE_TYPE}&scope=${SCOPE}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${codeChallenge}&code_challenge_method=${CODE_CHALLENGE_METHOD}&state=${STATE}`;
		//Linking.openURL(authUrl);
		setAuthUri(authUrl);
		if (authUrl) {
			setModalVisible(true);
		}
	};

	return (
		<View style={styles.supperContainer}>
			<StatusBarHeight />
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>WELCOME BACK</Text>
				<Text style={styles.headerContent}>So glad to meet you again!</Text>
			</View>
			<TouchableOpacity onPress={handleLogin} style={styles.button}>
				<Text style={styles.buttonText}>Login</Text>
			</TouchableOpacity>
			{authUri && (
				<Modal visible={modalVisible} onRequestClose={() => setAuthUri(null)} transparent={true} style={styles.modal}>
					<View style={styles.modalView}>
						<Pressable onPress={() => setModalVisible(false)}>
							<Icons.CircleXIcon height={size.s_20} width={size.s_20} />
						</Pressable>
						<View style={styles.webView}>
							<WebView source={{ uri: authUri }} />
						</View>
					</View>
				</Modal>
			)}
		</View>
	);
};

export default NewLoginScreen;
