import { useAuth } from '@mezon/core';
import { baseColor, size } from '@mezon/mobile-ui';
import { authActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/api.gen';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, NativeModules, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

type LoginMode = 'otp' | 'password' | 'sms';
const OTP_COOLDOWN_SECONDS = 60;

const LoginScreen = ({ navigation }) => {
	const styles = style();
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [loginMode, setLoginMode] = useState<LoginMode>('otp');
	const [lastOTPSentTime, setLastOTPSentTime] = useState<{ [email: string]: number }>({});
	const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

	const { t } = useTranslation(['common']);
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
	const isPasswordValid = password.length >= 1;
	const isFormValid = loginMode === 'otp' ? isEmailValid : loginMode === 'sms' ? isPhoneValid : isEmailValid && isPasswordValid;

	const clearBadgeCount = () => {
		try {
			NativeModules?.BadgeModule?.setBadgeCount?.(0);
		} catch (error) {
			console.error('Error clearing badge count:', error);
		}
	};

	const isInCooldown = (emailAddress: string) => {
		const lastSentTime = lastOTPSentTime[emailAddress];
		if (!lastSentTime) return false;
		const currentTime = Date.now();
		const timeDifference = (currentTime - lastSentTime) / 1000;
		return timeDifference < OTP_COOLDOWN_SECONDS;
	};

	const updateCooldownTimer = () => {
		const currentEmail = loginMode === 'sms' ? phone : email;
		const lastSentTime = lastOTPSentTime[currentEmail];

		if (!lastSentTime) {
			setCooldownRemaining(0);
			return;
		}

		const currentTime = Date.now();
		const timeDifference = (currentTime - lastSentTime) / 1000;
		const remaining = Math.max(0, OTP_COOLDOWN_SECONDS - timeDifference);
		setCooldownRemaining(Math.ceil(remaining));

		if (remaining <= 0) {
			// Remove this email from cooldown
			setLastOTPSentTime((prev) => {
				const newState = { ...prev };
				delete newState[currentEmail];
				return newState;
			});
		}
	};

	useEffect(() => {
		let interval: NodeJS.Timeout;

		const currentEmail = loginMode === 'sms' ? phone : email;
		const lastSentTime = lastOTPSentTime[currentEmail];

		if (lastSentTime && isInCooldown(currentEmail)) {
			interval = setInterval(updateCooldownTimer, 1000);
		} else {
			setCooldownRemaining(0);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [lastOTPSentTime, email, phone, loginMode]);

	const onLoadInit = async () => {
		if (clientRef?.current && clientRef?.current?.host !== process.env.NX_CHAT_APP_API_GW_HOST) {
			clientRef.current.setBasePath(process.env.NX_CHAT_APP_API_GW_HOST, process.env.NX_CHAT_APP_API_GW_PORT, true);
		}
	};

	useEffect(() => {
		onLoadInit();
		clearBadgeCount();
	}, []);

	const handleSendOTP = async () => {
		if (isInCooldown(email)) {
			Toast.show({
				type: 'success',
				props: {
					text2: `Login too fast. Please wait ${cooldownRemaining} seconds before trying again.`,
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
			return;
		}

		try {
			if (isEmailValid) {
				setIsLoading(true);
				const resp: any = await dispatch(authActions.authenticateEmailOTPRequest({ email }));
				const payload = resp?.payload as ApiLinkAccountConfirmRequest;
				const reqId = payload?.req_id;
				if (reqId) {
					setLastOTPSentTime((prev) => ({
						...prev,
						[email]: Date.now()
					}));

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
		if (isInCooldown(phone)) {
			Toast.show({
				type: 'success',
				props: {
					text2: `Login too fast. Please wait ${cooldownRemaining} seconds before trying again.`,
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
			return;
		}

		try {
			if (isPhoneValid) {
				setIsLoading(true);
				setLastOTPSentTime((prev) => ({
					...prev,
					[phone]: Date.now()
				}));

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
			<LinearGradient colors={['#f0edfd', '#beb5f8', '#9774fa']} style={[StyleSheet.absoluteFillObject]} />

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<View style={styles.content}>
					<Text style={styles.title}>{t('login.enterEmail')}</Text>
					<Text style={styles.subtitle}>{t('login.chooseAnotherOption')}</Text>

					<View style={styles.inputSection}>
						<View style={styles.inputWrapper}>
							<MezonIconCDN icon={IconCDN.mailIcon} width={size.s_20} height={size.s_20} color={'#454545'} />

							{(loginMode === 'otp' || loginMode === 'password') && (
								<TextInput
									style={styles.emailInput}
									placeholder={t('login.emailAddress')}
									placeholderTextColor={styles.placeholder.color}
									value={email}
									onChangeText={setEmail}
									keyboardType="email-address"
									autoCapitalize="none"
									autoCorrect={false}
									autoFocus={true}
									onSubmitEditing={handlePrimaryAction}
									underlineColorAndroid="transparent"
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
					</View>

					{loginMode === 'password' && (
						<View style={styles.inputSection}>
							<View style={styles.inputWrapper}>
								<MezonIconCDN
									icon={showPassword ? IconCDN.lockUnlockIcon : IconCDN.lockIcon}
									width={size.s_20}
									height={size.s_20}
									color={'#454545'}
								/>
								<TextInput
									style={styles.emailInput}
									placeholder={t('login.password')}
									placeholderTextColor={styles.placeholder.color}
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!showPassword}
									autoCapitalize="none"
									autoCorrect={false}
									onSubmitEditing={handlePrimaryAction}
								/>
							</View>
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
						style={[styles.otpButton, !isFormValid && styles.otpButtonDisabled]}
						onPress={handlePrimaryAction}
						disabled={!isFormValid || isLoading}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#FFFFFF" style={{ zIndex: 10 }} />
						) : (
							<Text style={[styles.otpButtonText]}>
								{loginMode === 'otp' || loginMode === 'sms' ? t('login.send') : t('login.login')}
							</Text>
						)}
						{isFormValid && (
							<LinearGradient
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								colors={['#501794', '#3E70A1']}
								style={[StyleSheet.absoluteFillObject]}
							/>
						)}
					</TouchableOpacity>

					<View style={styles.alternativeSection}>
						{loginMode === 'otp' ? (
							<>
								<Text style={styles.alternativeText}>{t('login.cannotAccessYourEmail')}</Text>
								<View style={styles.alternativeOptions}>
									{/* TODO: open for login SMS */}
									{/*<TouchableOpacity onPress={handleSMSLogin}>*/}
									{/*	<Text style={styles.linkText}>{t('login.loginWithSMS')}</Text>*/}
									{/*</TouchableOpacity>*/}
									{/*<Text style={styles.orText}>{t('login.or')}</Text>*/}
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
