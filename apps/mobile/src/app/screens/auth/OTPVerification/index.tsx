import { useAuth } from '@mezon/core';
import { baseColor } from '@mezon/mobile-ui';
import { authActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { ApiLinkAccountConfirmRequest } from 'mezon-js/api.gen';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Alert,
	AppState,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface OTPVerificationScreenProps {
	navigation: any;
	route: {
		params: {
			email: string;
			reqId: string;
		};
	};
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ navigation, route }) => {
	const styles = style();
	const { t } = useTranslation('common');
	const { email, reqId } = route.params;
	const { confirmEmailOTP } = useAuth();

	const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
	const [reqIdSent, setReqIdSent] = useState<string>(reqId);
	const inputRefs = useRef<(TextInput | null)[]>([]);
	const [countdown, setCountdown] = useState(59);
	const [isResendEnabled, setIsResendEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const dispatch = useAppDispatch();

	const countdownStartTime = useRef<number>(Date.now());
	const timerRef = useRef<NodeJS.Timeout | null>(null);

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

	// Handle app state changes
	useEffect(() => {
		const handleAppStateChange = (nextAppState: string) => {
			if (nextAppState === 'active' && !isResendEnabled) {
				// App came to foreground, recalculate countdown
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

	const fillOtp = (otp: string) => {
		const otps = otp.split('');
		otps.forEach((digit, index) => {
			if (inputRefs.current[index]) {
				inputRefs.current[index].setNativeProps({ text: digit });
			}
		});
		setOtp(otps);
	};

	const isValidOTP = otp?.every?.((digit) => digit !== '') && otp?.join?.('')?.length === 6;

	const handleVerifyOTP = async (otpConfirm) => {
		try {
			if (otpConfirm?.length === 6) {
				setIsLoading(true);
				const resp: any = await confirmEmailOTP({ otp_code: otpConfirm, req_id: reqIdSent });
				if (!resp) {
					Toast.show({
						type: 'success',
						props: {
							text2: 'OTP does not match',
							leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
						}
					});
					setIsError(true);
				}

				setIsLoading(false);
			}
		} catch (error) {
			setIsError(true);
			console.error('Error verifying OTP:', error);
			Toast.show({
				type: 'success',
				props: {
					text2: 'An error occurred while verifying OTP',
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
		}
	};

	const handleResendOTP = async () => {
		if (isResendEnabled) {
			const resp: any = await dispatch(authActions.authenticateEmailOTPRequest({ email }));
			const payload = resp?.payload as ApiLinkAccountConfirmRequest;

			const reqId = payload?.req_id;
			if (reqId) {
				inputRefs?.current?.[0]?.focus();
				setReqIdSent(reqId);
				setOtp(new Array(6).fill(''));
				startCountdown();
			} else {
				Toast.show({
					type: 'error',
					text1: 'Resend OTP Failed',
					text2: resp?.error?.message || 'An error occurred while sending OTP'
				});
			}
		}
	};

	const handleChangeEmail = () => {
		Alert.alert(
			t('otpVerify.changeEmailTitle'),
			t('otpVerify.changeEmailMessage'),
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

	const handleGetHelp = () => {
		// Handle get help logic here
	};

	const handleOtpChange = (value: string, index: number) => {
		try {
			if (value.length === 6) {
				fillOtp(value);
				handleVerifyOTP(value);
				return;
			}
			if (isError) {
				setIsError(false);
			}
			const newOtp = [...otp];

			// Handle backspace
			if (value === '') {
				newOtp[index] = '';
				setOtp(newOtp);
				return;
			}
			// Handle normal input
			if (value.length >= 1 && /^\d*$/.test(value)) {
				const valueLastest = value[value.length - 1];
				newOtp[index] = valueLastest;
				setOtp(newOtp);

				// Auto focus next input if current is filled
				if (valueLastest !== '' && index < 6 - 1) {
					inputRefs.current[index + 1]?.focus();
				}

				// Check if OTP is complete
				if (newOtp.every((digit) => digit !== '')) {
					if (isResendEnabled) return;
					handleVerifyOTP(newOtp.join(''));
					// onComplete?.(newOtp.join(''));
				}
			}
		} catch (error) {
			console.error('handleOtpChange error', error);
		}
	};

	const handleKeyPress = (e: any, index: number) => {
		if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
			inputRefs?.current?.[index - 1]?.focus();
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container} bounces={false} keyboardShouldPersistTaps={'handled'}>
			<LinearGradient colors={['#f0edfd', '#beb5f8', '#9774fa']} style={[StyleSheet.absoluteFillObject]} />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<View style={styles.content}>
					<Text style={styles.title}>{t('otpVerify.loginToMezon')}</Text>

					<View style={styles.instructionSection}>
						<Text style={styles.instructionText}>{t('otpVerify.enterCodeFrom')}</Text>
						<Text style={styles.emailText}>{email}</Text>
					</View>

					<View style={{ alignSelf: 'center' }}>
						<View style={styles.inputSection}>
							{otp.map((digit, index) => (
								<TextInput
									key={index}
									ref={(ref) => (inputRefs.current[index] = ref)}
									style={[
										styles.input,
										digit !== '' ? styles.inputFilled : styles.inputEmpty,
										index === 0 ? styles.inputFirst : {},
										isError && styles.inputError
									]}
									value={digit}
									onChangeText={(value) => handleOtpChange(value, index)}
									onKeyPress={(e) => handleKeyPress(e, index)}
									keyboardType="number-pad"
									maxLength={6}
									autoFocus={index === 0}
									// autoComplete={'sms-otp'}
									// textContentType={'oneTimeCode'}
									selectTextOnFocus={true}
								/>
							))}
						</View>
						<TouchableOpacity
							style={[styles.verifyButton, !isValidOTP && styles.verifyButtonDisabled]}
							onPress={isResendEnabled ? () => handleResendOTP() : () => handleVerifyOTP(otp?.join?.(''))}
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
								<Text style={styles.linkText}>{t('otpVerify.changeEmail')}</Text>
							</TouchableOpacity>
							{/*todo: add get help*/}
							{/*<Text style={styles.orText}>{t('otpVerify.or')}</Text>*/}
							{/*<TouchableOpacity onPress={handleGetHelp}>*/}
							{/*	<Text style={styles.linkText}>{t('otpVerify.getHelp')}</Text>*/}
							{/*</TouchableOpacity>*/}
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</ScrollView>
	);
};

export default OTPVerificationScreen;
