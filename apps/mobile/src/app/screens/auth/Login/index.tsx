import { useAuth } from '@mezon/core';
import { STORAGE_IS_LAST_ACTIVE_TAB_DM, save } from '@mezon/mobile-components';
import { baseColor, size } from '@mezon/mobile-ui';
import { authActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { useFocusEffect } from '@react-navigation/native';
import type { ApiLinkAccountConfirmRequest } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Dimensions,
	NativeModules,
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
import { ErrorInput } from '../../../components/ErrorInput';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { CountryDropdown, countries, type ICountry } from '../../home/homedrawer/components/CountryDropdown';
import { style } from './styles';

type LoginMode = 'otp' | 'password' | 'sms';
const OTP_COOLDOWN_SECONDS = 60;
type ICooldownInfo = { isInCooldown: boolean; remaining: number };
const LoginScreen = ({ navigation }) => {
	const styles = style();
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [selectedCountry, setSelectedCountry] = useState<ICountry>(countries[0]);
	const [isShowDropdown, setIsShowDropdown] = useState<boolean>(false);
	const [isValidPhoneNumber, setIsValidPhoneNumber] = useState<boolean | null>(null);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isLandscape, setIsLandscape] = useState(false);
	const [loginMode, setLoginMode] = useState<LoginMode>('sms');
	const [lastOTPSentTime, setLastOTPSentTime] = useState<{ [email: string]: number }>({});
	const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
	const isTabletLandscape = useTabletLandscape();

	useFocusEffect(
		useCallback(() => {
			setIsShowDropdown(false);
		}, [])
	);

	useEffect(() => {
		if (loginMode !== 'sms') {
			setIsShowDropdown(false);
		}
	}, [loginMode]);

	const { t } = useTranslation(['common']);
	const dispatch = useAppDispatch();
	const isValidEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};
	const { authenticateEmailPassword } = useAuth();
	const { clientRef } = useMezon();
	const isEmailValid = isValidEmail(email);
	const isPasswordValid = password.length >= 1;
	const isFormValid = loginMode === 'otp' ? isEmailValid : loginMode === 'sms' ? isValidPhoneNumber : isEmailValid && isPasswordValid;

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

	const clearBadgeCount = () => {
		try {
			NativeModules?.BadgeModule?.setBadgeCount?.(0);
		} catch (error) {
			console.error('Error clearing badge count:', error);
		}
	};

	const getInfoInCooldown = (emailAddress: string): ICooldownInfo => {
		const lastSentTime = lastOTPSentTime[emailAddress];
		if (!lastSentTime)
			return {
				isInCooldown: false,
				remaining: 0
			};
		const currentTime = Date.now();
		const timeDifference = (currentTime - lastSentTime) / 1000;
		return {
			isInCooldown: timeDifference < OTP_COOLDOWN_SECONDS,
			remaining: Math.round(OTP_COOLDOWN_SECONDS - timeDifference)
		};
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

		if (lastSentTime && getInfoInCooldown(currentEmail)?.isInCooldown) {
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
		save(STORAGE_IS_LAST_ACTIVE_TAB_DM, 'false');
		if (
			clientRef?.current &&
			(clientRef?.current?.host !== process.env.NX_CHAT_APP_API_GW_HOST || clientRef?.current?.port !== process.env.NX_CHAT_APP_API_GW_PORT)
		) {
			clientRef.current.setBasePath(process.env.NX_CHAT_APP_API_GW_HOST, process.env.NX_CHAT_APP_API_GW_PORT, true);
		}
	};

	useEffect(() => {
		onLoadInit();
		clearBadgeCount();
	}, []);

	const handleSendOTP = async () => {
		const infoInCooldown: ICooldownInfo = getInfoInCooldown(email);
		if (infoInCooldown?.isInCooldown) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('login.loginTooFast', { seconds: infoInCooldown?.remaining || cooldownRemaining })
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
						type: 'error',
						props: {
							text2: resp?.error?.message || t('otpVerify.sendOtpError')
						}
					});
				}
				setIsLoading(false);
			}
		} catch (error) {
			setIsLoading(false);
			console.error('Error sending OTP:', error);
			Toast.show({
				type: 'error',
				props: {
					text2: error?.message || t('otpVerify.sendOtpError')
				}
			});
		}
	};

	const handleSendPhoneOTP = async () => {
		let processedPhoneNumber = phone;
		if (selectedCountry.prefix === '+84' && phone.startsWith('0')) {
			processedPhoneNumber = phone.substring(1);
		}
		const fullPhoneNumber = `${selectedCountry.prefix}${processedPhoneNumber}`;
		const infoInCooldown: ICooldownInfo = getInfoInCooldown(fullPhoneNumber);
		if (infoInCooldown?.isInCooldown) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('login.loginTooFast', { seconds: infoInCooldown?.remaining })
				}
			});
			return;
		}

		try {
			setIsLoading(true);
			const resp: any = await dispatch(authActions.authenticatePhoneSMSOTPRequest({ phone: fullPhoneNumber }));
			const payload = resp?.payload as ApiLinkAccountConfirmRequest;
			const reqId = payload?.req_id;
			if (reqId) {
				setLastOTPSentTime((prev) => ({
					...prev,
					[fullPhoneNumber]: Date.now()
				}));

				navigation.navigate(APP_SCREEN.VERIFY_OTP, { phoneNumber: fullPhoneNumber, reqId });
			} else {
				Toast.show({
					type: 'error',
					props: {
						text2: resp?.error?.message || t('otpVerify.sendOtpError')
					}
				});
			}
			setIsLoading(false);
		} catch (error) {
			setIsLoading(false);
			console.error('Error sending phone OTP:', error);
			Toast.show({
				type: 'error',
				props: {
					text2: error?.message || t('otpVerify.sendOtpError')
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
						type: 'error',
						props: {
							text2: t('login.loginFailed')
						}
					});
				}
			} catch (e) {
				Toast.show({
					type: 'error',
					props: {
						text2: e?.message || t('login.loginFailed')
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
	const checkValidPhoneNumber = useCallback(
		(phoneData: string, prefix: string = selectedCountry.prefix) => {
			if (phoneData.length === 0) return null;

			if (prefix === '+84') {
				const vietnamPhoneRegex = /^0?(3|5|7|8|9)[0-9]{8}$/;
				return vietnamPhoneRegex.test(phoneData);
			}

			if (phoneData.length < 7) return false;
			return /^\d+$/.test(phoneData);
		},
		[selectedCountry.prefix]
	);

	const onChangePhone = (value: string) => {
		setPhone(value);
		setIsValidPhoneNumber(checkValidPhoneNumber(value));
	};

	const handleCountrySelect = useCallback(
		(country: ICountry) => {
			setSelectedCountry(country);
			setIsShowDropdown(false);
			setIsValidPhoneNumber(checkValidPhoneNumber(phone, country.prefix));
		},
		[checkValidPhoneNumber, phone]
	);

	return (
		<ScrollView contentContainerStyle={styles.container} bounces={false} keyboardShouldPersistTaps={'handled'}>
			<LinearGradient colors={['#f0edfd', '#beb5f8', '#9774fa']} style={[StyleSheet.absoluteFillObject]} />

			<KeyboardAvoidingView
				style={styles.main}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
			>
				<View style={[styles.content, isLandscape && !isTabletLandscape && { paddingTop: size.s_10 }]}>
					<Text style={styles.title}>{loginMode === 'sms' ? t('login.enterPhone') : t('login.enterEmail')}</Text>
					<Text style={styles.subtitle}>{t('login.chooseAnotherOption')}</Text>

					<View style={styles.inputSection}>
						{loginMode === 'sms' ? (
							<View style={styles.phoneContainer}>
								<TouchableOpacity style={styles.countryButton} onPress={() => setIsShowDropdown(!isShowDropdown)}>
									<MezonIconCDN icon={selectedCountry.icon} useOriginalColor customStyle={styles.customStyleFlagIcon} />
									<Text style={styles.inputCountry}>{selectedCountry.prefix}</Text>
								</TouchableOpacity>

								<View style={styles.main}>
									<TextInput
										style={styles.emailInput}
										placeholder={t('login.phone')}
										placeholderTextColor={styles.placeholder.color}
										value={phone}
										onChangeText={onChangePhone}
										keyboardType={'phone-pad'}
										autoCapitalize="none"
										autoCorrect={false}
										autoFocus={true}
										onSubmitEditing={handlePrimaryAction}
										underlineColorAndroid="transparent"
									/>
								</View>
								<CountryDropdown
									onCountrySelect={handleCountrySelect}
									isVisible={isShowDropdown}
									selectedCountry={selectedCountry}
									backgroundColor={'#f6f6f6'}
								/>
								<View style={styles.errorContainer}>
									{isValidPhoneNumber === false && <ErrorInput errorMessage={t('login.invalidPhoneNumber')} />}
								</View>
							</View>
						) : (
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
							</View>
						)}
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
							<ActivityIndicator size="small" color="#FFFFFF" style={styles.loading} />
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
						<Text style={styles.alternativeText}>
							{loginMode === 'otp'
								? t('login.cannotAccessYourEmail')
								: loginMode === 'sms'
									? t('login.cannotAccessYourPhone')
									: t('login.passwordNotSet')}
						</Text>
						<View style={styles.alternativeOptions}>
							<TouchableOpacity onPress={loginMode === 'otp' ? () => handleSMSLogin() : () => switchToOTPMode()}>
								<Text style={styles.linkText}>{loginMode === 'otp' ? t('login.loginWithSMS') : t('login.loginWithEmailOTP')}</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={loginMode !== 'password' ? switchToPasswordMode : handleSMSLogin}>
								<Text style={styles.linkText}>
									{loginMode !== 'password' ? t('login.loginWithPassword') : t('login.loginWithSMS')}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</ScrollView>
	);
};

export default LoginScreen;
