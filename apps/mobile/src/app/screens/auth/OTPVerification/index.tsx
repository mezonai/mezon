import { useAuth } from '@mezon/core';
import { baseColor, size } from '@mezon/mobile-ui';
import { appActions, authActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Alert,
	AppState,
	Dimensions,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import OTPInput from '../../home/homedrawer/components/OTPInput';
import { style } from './styles';

interface OTPVerificationScreenProps {
	navigation: any;
	route: {
		params: {
			email?: string;
			phoneNumber?: string;
			reqId: string;
		};
	};
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ navigation, route }) => {
	const styles = style();
	const { t } = useTranslation('common');
	const { reqId, email = '', phoneNumber = '' } = route.params;
	const { confirmEmailOTP } = useAuth();

	const [currentOtp, setCurrentOtp] = useState<string[]>(new Array(6).fill(''));
	const [reqIdSent, setReqIdSent] = useState<string>(reqId);
	const [countdown, setCountdown] = useState<number>(59);
	const [isResendEnabled, setIsResendEnabled] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isError, setIsError] = useState<boolean>(false);
	const [isLandscape, setIsLandscape] = useState(false);
	const [resetTrigger, setResetTrigger] = useState(0);
	const dispatch = useAppDispatch();
	const isTabletLandscape = useTabletLandscape();

	const countdownStartTime = useRef<number>(Date.now());
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const checkOrientation = () => {
		const { width, height } = Dimensions.get('screen');
		setIsLandscape(width > height);
	};

	useEffect(() => {
		checkOrientation();

		const subscription = Dimensions.addEventListener('change', () => {
			checkOrientation();
		});

		return () => subscription?.remove();
	}, []);

	useEffect(() => {
		if (reqId) {
			setReqIdSent(reqId);
			setIsError(false);
		}
	}, [reqId]);

	const startCountdown = () => {
		countdownStartTime.current = Date.now();
		setCountdown(59);
		setIsResendEnabled(false);

		if (timerRef.current) {
			clearInterval(timerRef.current);
		}

		timerRef.current = setInterval(() => {
			const elapsed = Math.floor((Date.now() - countdownStartTime.current) / 1000);
			const remaining = Math.max(59 - elapsed, 0);

			setCountdown(remaining);

			if (remaining <= 0) {
				setIsResendEnabled(true);
				if (timerRef.current) {
					clearInterval(timerRef.current);
					timerRef.current = null;
				}
			}
		}, 1000);
	};

	useEffect(() => {
		const handleAppStateChange = (nextAppState: string) => {
			if (nextAppState === 'active' && !isResendEnabled) {
				const elapsed = Math.floor((Date.now() - countdownStartTime.current) / 1000);
				const remaining = Math.max(59 - elapsed, 0);

				setCountdown(remaining);

				if (remaining <= 0) {
					setIsResendEnabled(true);
					if (timerRef.current) {
						clearInterval(timerRef.current);
						timerRef.current = null;
					}
				}
			}
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);
		startCountdown();

		return () => {
			subscription?.remove();
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, []);

	const isValidOTP = currentOtp?.every?.((digit) => digit !== '') && currentOtp?.join?.('')?.length === 6;

	const handleVerifyOTP = useCallback(
		async (otpConfirm: string) => {
			try {
				if (otpConfirm?.length === 6) {
					setIsLoading(true);
					const resp: any = await confirmEmailOTP({ otp_code: otpConfirm, req_id: reqIdSent });

					if (!resp) {
						Toast.show({
							type: 'error',
							props: {
								text2: t('otpVerify.otpNotMatch')
							}
						});
						setIsError(true);
					} else {
						// If the account is newly created or a username is missing, prompt for username update
						if (!resp?.username || resp?.username === phoneNumber) {
							dispatch(appActions.setIsShowUpdateUsername(true));
						}
					}

					setIsLoading(false);
				}
			} catch (error) {
				setIsError(true);
				console.error('Error verifying OTP:', error);
				Toast.show({
					type: 'error',
					props: {
						text2: t('otpVerify.verifyOtpError')
					}
				});
			}
		},
		[confirmEmailOTP, dispatch, phoneNumber, reqIdSent, t]
	);

	const handleResendOTP = async () => {
		if (isResendEnabled) {
			let resp: any;
			if (email) {
				resp = await dispatch(authActions.authenticateEmailOTPRequest({ email }));
			} else {
				resp = await dispatch(authActions.authenticatePhoneSMSOTPRequest({ phone: phoneNumber }));
			}
			const payload = resp?.payload as ApiLinkAccountConfirmRequest;

			const reqId = payload?.req_id;
			if (reqId) {
				setReqIdSent(reqId);
				setResetTrigger((prev) => prev + 1);
				startCountdown();
			} else {
				Toast.show({
					type: 'error',
					text1: t('otpVerify.resendOtpFailed'),
					text2: resp?.error?.message || t('otpVerify.sendOtpError')
				});
			}
		}
	};

	const handleChangeEmail = () => {
		Alert.alert(
			email ? t('otpVerify.changeEmailTitle') : t('otpVerify.changePhone'),
			email ? t('otpVerify.changeEmailMessage') : t('otpVerify.changePhoneMessage'),
			[
				{
					text: t('otpVerify.cancel'),
					style: 'cancel'
				},
				{
					text: t('otpVerify.confirm'),
					style: 'destructive',
					onPress: () => {
						if (timerRef.current) {
							clearInterval(timerRef.current);
							timerRef.current = null;
						}
						navigation.goBack();
					}
				}
			],
			{ cancelable: true }
		);
	};

	const handleOtpChange = useCallback(
		(otp: string[]) => {
			if (isError) {
				setIsError(false);
			}
			setCurrentOtp(otp);
		},
		[isError]
	);

	const handleOtpComplete = useCallback(
		(otp: string) => {
			if (isResendEnabled) return;
			handleVerifyOTP(otp);
		},
		[isResendEnabled, handleVerifyOTP]
	);

	return (
		<ScrollView contentContainerStyle={styles.container} bounces={false} keyboardShouldPersistTaps={'handled'}>
			<LinearGradient colors={['#f0edfd', '#beb5f8', '#9774fa']} style={[StyleSheet.absoluteFillObject]} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<View style={[styles.content, isLandscape && !isTabletLandscape && { paddingTop: size.s_10 }]}>
					<Text style={styles.title}>{t('otpVerify.loginToMezon')}</Text>

					<View style={styles.instructionSection}>
						<Text style={styles.instructionText}>{t('otpVerify.enterCodeFrom')}</Text>
						<Text style={styles.emailText}>{email || phoneNumber}</Text>
					</View>

					<View style={{ alignSelf: 'center' }}>
						<OTPInput
							onOtpChange={handleOtpChange}
							onOtpComplete={handleOtpComplete}
							isError={isError}
							resetTrigger={resetTrigger}
							isSms={!!phoneNumber}
						/>

						<TouchableOpacity
							style={[styles.verifyButton, !isValidOTP && styles.verifyButtonDisabled]}
							onPress={isResendEnabled ? () => handleResendOTP() : () => handleVerifyOTP(currentOtp?.join?.(''))}
							disabled={(!isValidOTP && !isResendEnabled) || isLoading}
						>
							{isLoading ? (
								<ActivityIndicator size="small" color="#FFFFFF" style={{ zIndex: 10 }} />
							) : (
								<Text style={[styles.verifyButtonText]}>
									{isResendEnabled ? t('otpVerify.resendOTP') : `${t('otpVerify.verifyOTP')} (${countdown})`}
								</Text>
							)}

							{(isValidOTP || isResendEnabled) && (
								<LinearGradient
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									colors={['#501794', '#3E70A1']}
									style={[StyleSheet.absoluteFillObject]}
								/>
							)}
						</TouchableOpacity>
					</View>

					<View style={styles.alternativeSection}>
						<Text style={styles.alternativeText}>{t('otpVerify.didNotReceiveCode')}</Text>
						<View style={styles.alternativeOptions}>
							<TouchableOpacity onPress={handleChangeEmail}>
								<Text style={styles.linkText}>{email ? t('otpVerify.changeEmail') : t('otpVerify.changePhone')}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</ScrollView>
	);
};

export default OTPVerificationScreen;
