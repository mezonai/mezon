import { useAuth } from '@mezon/core';
import { baseColor, size } from '@mezon/mobile-ui';
import { authActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/api.gen';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type LoginMode = 'otp' | 'password' | 'sms';

const LoginScreen = ({ navigation }) => {
	const styles = style();
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [loginMode, setLoginMode] = useState<LoginMode>('otp');
	const { t } = useTranslation(['common']);
	const { t: tAccount } = useTranslation(['accountSetting']);
	const dispatch = useAppDispatch();
	const isValidEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};
	const isValidPhone = (phone: string) => {
		const phoneRegex = /^[+]?[\d\s-()]{10,15}$/;
		return phoneRegex.test(phone.replace(/\s|-|\(|\)/g, ''));
	};
	const { authenticateEmailPassword } = useAuth();
	const { clientRef } = useMezon();
	const isEmailValid = isValidEmail(email);
	const isPhoneValid = isValidPhone(phone);
	const isPasswordValid = password.length >= 8;
	const isFormValid = loginMode === 'otp' ? isEmailValid : loginMode === 'sms' ? isPhoneValid : isEmailValid && isPasswordValid;

	const onLoadInit = async () => {
		if (clientRef?.current && clientRef?.current?.host !== process.env.NX_CHAT_APP_API_GW_HOST) {
			clientRef.current.setBasePath(process.env.NX_CHAT_APP_API_GW_HOST, process.env.NX_CHAT_APP_API_GW_PORT, true);
		}
	};

	useEffect(() => {
		onLoadInit();
	}, []);

	const validatePassword = (value: string) => {
		if (value.length < 8) {
			return tAccount('setPasswordAccount.error.characters');
		}
		if (!/[A-Z]/.test(value)) {
			return tAccount('setPasswordAccount.error.uppercase');
		}
		if (!/[a-z]/.test(value)) {
			return tAccount('setPasswordAccount.error.lowercase');
		}
		if (!/[0-9]/.test(value)) {
			return tAccount('setPasswordAccount.error.number');
		}
		if (!/[^A-Za-z0-9]/.test(value)) {
			return tAccount('setPasswordAccount.error.symbol');
		}
		return '';
	};

	const handleSendOTP = async () => {
		try {
			if (isEmailValid) {
				setIsLoading(true);
				const resp: any = await dispatch(authActions.authenticateEmailOTPRequest({ email }));
				const payload = resp?.payload as ApiLinkAccountConfirmRequest;
				const reqId = payload?.req_id;
				if (reqId) {
					navigation.navigate(APP_SCREEN.VERIFY_OTP, { email, reqId });
				} else {
					Toast.show({
						type: 'success',
						props: {
							text2: resp?.error?.message || 'An error occurred while sending OTP',
							leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
						}
					});
				}
				setIsLoading(false);
			}
		} catch (error) {
			setIsLoading(false);
			console.error('Error sending OTP:', error);
			Toast.show({
				type: 'success',
				props: {
					text2: error?.message || 'An error occurred while sending OTP',
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
		}
	};

	const handleSendPhoneOTP = async () => {
		try {
			if (isPhoneValid) {
				setIsLoading(true);
				// todo: add more logic
				setIsLoading(false);
			}
		} catch (error) {
			setIsLoading(false);
			console.error('Error sending phone OTP:', error);
			Toast.show({
				type: 'success',
				props: {
					text2: error?.message || 'An error occurred while sending OTP',
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
		}
	};

	const handlePasswordLogin = async () => {
		const errorMsgPassword = validatePassword(password);

		if (errorMsgPassword) {
			Toast.show({
				type: 'success',
				props: {
					text2: errorMsgPassword,
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
			return;
		}
		if (isEmailValid && isPasswordValid) {
			try {
				const resp: any = await authenticateEmailPassword({ email, password });
				if (!resp) {
					Toast.show({
						type: 'success',
						props: {
							text2: 'Login Failed! An error occurred during login',
							leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
						}
					});
				}
			} catch (e) {
				Toast.show({
					type: 'success',
					props: {
						text2: e?.message || 'Login Failed! An error occurred during login',
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
					}
				});
			}
		}
	};

	const handlePrimaryAction = () => {
		if (loginMode === 'otp') {
			handleSendOTP();
		} else if (loginMode === 'sms') {
			handleSendPhoneOTP();
		} else {
			handlePasswordLogin();
		}
	};

	const handleSMSLogin = () => {
		setLoginMode('sms');
	};

	const switchToPasswordMode = () => {
		setLoginMode('password');
	};

	const switchToOTPMode = () => {
		setLoginMode('otp');
		setPassword('');
		setShowPassword(false);
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<ScrollView contentContainerStyle={styles.container} bounces={false} keyboardShouldPersistTaps={'handled'}>
			<LinearGradient colors={['#3574FE', '#978AFF', '#DCCFFF']} style={[StyleSheet.absoluteFillObject]} />

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<View style={styles.content}>
					<Text style={styles.title}>{t('login.loginToMezon')}</Text>
					<Text style={styles.subtitle}>{t('login.gladToMeetAgain')}</Text>

					<View style={styles.inputSection}>
						<Text style={styles.inputLabel}>
							{loginMode === 'otp'
								? t('login.enterEmail')
								: loginMode === 'sms'
									? t('login.enterPhoneToLogin')
									: t('login.enterEmailToLogin')}
						</Text>
						{loginMode === 'otp' && (
							<TextInput
								style={styles.emailInput}
								placeholder={t('login.emailAddress')}
								placeholderTextColor={styles.placeholder.color}
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
								autoCorrect={false}
							/>
						)}
						{loginMode === 'sms' && (
							<TextInput
								style={styles.emailInput}
								placeholder={t('login.phone')}
								placeholderTextColor={styles.placeholder.color}
								value={phone}
								onChangeText={setPhone}
								keyboardType={'phone-pad'}
								autoCapitalize="none"
								autoCorrect={false}
							/>
						)}
					</View>

					{loginMode === 'password' && (
						<View style={styles.inputSection}>
							<TextInput
								style={styles.emailInput}
								placeholder={t('login.password')}
								placeholderTextColor={styles.placeholder.color}
								value={password}
								onChangeText={setPassword}
								secureTextEntry={!showPassword}
								autoCapitalize="none"
								autoCorrect={false}
							/>
							<TouchableOpacity style={styles.showPasswordContainer} onPress={togglePasswordVisibility}>
								<View style={styles.checkboxContainer}>
									<View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
										{showPassword && (
											<MezonIconCDN
												icon={IconCDN.checkmarkLargeIcon}
												color={baseColor.white}
												width={size.s_18}
												height={size.s_18}
											/>
										)}
									</View>
									<Text style={styles.showPasswordText}>{t('login.showPassword')}</Text>
								</View>
							</TouchableOpacity>
						</View>
					)}

					<TouchableOpacity
						style={[styles.otpButton, isFormValid && !isLoading ? styles.otpButtonActive : styles.otpButtonDisabled]}
						onPress={handlePrimaryAction}
						disabled={!isFormValid || isLoading}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
						) : (
							<Text style={[styles.otpButtonText]}>
								{loginMode === 'otp' || loginMode === 'sms' ? t('login.send') : t('login.login')}
							</Text>
						)}
					</TouchableOpacity>

					<View style={styles.alternativeSection}>
						{loginMode === 'otp' ? (
							<>
								<Text style={styles.alternativeText}>{t('login.cannotAccessYourEmail')}</Text>
								<View style={styles.alternativeOptions}>
									<TouchableOpacity onPress={handleSMSLogin}>
										<Text style={styles.linkText}>{t('login.loginWithSMS')}</Text>
									</TouchableOpacity>
									<Text style={styles.orText}>{t('login.or')}</Text>
									<TouchableOpacity onPress={switchToPasswordMode}>
										<Text style={styles.linkText}>{t('login.loginWithPassword')}</Text>
									</TouchableOpacity>
								</View>
							</>
						) : (
							<>
								<Text style={styles.alternativeText}>{t('login.passwordNotSet')}</Text>
								<TouchableOpacity onPress={switchToOTPMode}>
									<Text style={styles.linkText}>{t('login.loginWithOTP')}</Text>
								</TouchableOpacity>
							</>
						)}
					</View>
				</View>
			</KeyboardAvoidingView>
		</ScrollView>
	);
};

export default LoginScreen;
