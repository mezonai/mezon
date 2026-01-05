/* eslint-disable @nx/enforce-module-boundaries */
import { load, save } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { accountActions, appActions, useAppDispatch } from '@mezon/store-mobile';
import { ErrorInput } from 'apps/mobile/src/app/components/ErrorInput';
import type { ApiAccountEmail } from 'mezon-js/types';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonButton from '../../../../componentUI/MezonButton';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

const OTP_COOLDOWN_SECONDS = 60;
const OTP_CACHE_STORAGE_KEY = '@otp_cooldown_cache_email';

export const UpdateEmail = memo(({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue } = useTheme();
	const currentEmail = route?.params?.currentEmail || '';
	const { t } = useTranslation('accountSetting');
	const styles = style(themeValue);
	const dispatch = useAppDispatch();

	const [email, setEmail] = useState<string>('');
	const [isValidEmail, setIsValidEmail] = useState<boolean>(true);
	const [remainingTime, setRemainingTime] = useState<number>(0);
	const [isCacheLoaded, setIsCacheLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (currentEmail) {
			setEmail(currentEmail);
		}
	}, [currentEmail]);

	const otpCacheRef = useRef<Map<string, number>>(new Map());
	const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const loadCache = async () => {
			try {
				const cachedData = await load(OTP_CACHE_STORAGE_KEY);
				if (cachedData) {
					const parsed = JSON.parse(cachedData);
					const currentTime = Date.now();

					const validEntries: [string, number][] = [];
					Object.entries(parsed).forEach(([email, timestamp]) => {
						const elapsed = Math.floor((currentTime - (timestamp as number)) / 1000);
						if (elapsed < OTP_COOLDOWN_SECONDS) {
							validEntries.push([email, timestamp as number]);
						}
					});

					otpCacheRef.current = new Map(validEntries);
				}
				setIsCacheLoaded(true);
			} catch (error) {
				console.error('Error loading OTP cache:', error);
				setIsCacheLoaded(true);
			}
		};

		loadCache();
	}, []);

	const saveCacheToStorage = useCallback(async () => {
		try {
			const cacheObject = Object.fromEntries(otpCacheRef.current.entries());
			await save(OTP_CACHE_STORAGE_KEY, JSON.stringify(cacheObject));
		} catch (error) {
			console.error('Error saving OTP cache:', error);
		}
	}, []);

	const cleanupExpiredEntries = useCallback(async () => {
		const currentTime = Date.now();
		let hasChanges = false;

		otpCacheRef.current.forEach((timestamp, email) => {
			const elapsed = Math.floor((currentTime - timestamp) / 1000);
			if (elapsed >= OTP_COOLDOWN_SECONDS) {
				otpCacheRef.current.delete(email);
				hasChanges = true;
			}
		});

		if (hasChanges) {
			await saveCacheToStorage();
		}
	}, [saveCacheToStorage]);

	const checkValidEmail = useCallback((emailStr: string) => {
		if (emailStr?.trim()?.length === 0) return true;

		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		return emailRegex.test(emailStr.trim());
	}, []);

	const handleEmailChange = useCallback(
		(value: string) => {
			setEmail(value);
			setIsValidEmail(checkValidEmail(value));
			if (!isCacheLoaded) return;

			const lastSentTime = otpCacheRef.current.get(value);
			if (lastSentTime) {
				const elapsed = Math.floor((Date.now() - lastSentTime) / 1000);
				const remaining = OTP_COOLDOWN_SECONDS - elapsed;
				setRemainingTime(remaining > 0 ? remaining : 0);

				if (remaining > 0 && !cooldownTimerRef.current) {
					if (cooldownTimerRef.current) {
						clearInterval(cooldownTimerRef.current);
					}
					cooldownTimerRef.current = setInterval(() => {
						const currentLastSentTime = otpCacheRef.current.get(value);
						if (!currentLastSentTime) {
							setRemainingTime(0);
							if (cooldownTimerRef.current) {
								clearInterval(cooldownTimerRef.current);
								cooldownTimerRef.current = null;
							}
							return;
						}

						const elapsed = Math.floor((Date.now() - currentLastSentTime) / 1000);
						const remaining = OTP_COOLDOWN_SECONDS - elapsed;

						if (remaining <= 0) {
							setRemainingTime(0);
							if (cooldownTimerRef.current) {
								clearInterval(cooldownTimerRef.current);
								cooldownTimerRef.current = null;
							}
							cleanupExpiredEntries();
						} else {
							setRemainingTime(remaining);
						}
					}, 1000);
				}
			} else {
				setRemainingTime(0);
			}
		},
		[checkValidEmail, isCacheLoaded, cleanupExpiredEntries]
	);

	const startCooldownTimer = useCallback(
		async (emailValue: string) => {
			const currentTime = Date.now();
			otpCacheRef.current.set(emailValue, currentTime);

			await saveCacheToStorage();

			if (cooldownTimerRef.current) {
				clearInterval(cooldownTimerRef.current);
			}

			const updateRemainingTime = () => {
				const lastSentTime = otpCacheRef.current.get(email);
				if (!lastSentTime) {
					setRemainingTime(0);
					return;
				}

				const elapsed = Math.floor((Date.now() - lastSentTime) / 1000);
				const remaining = OTP_COOLDOWN_SECONDS - elapsed;

				if (remaining <= 0) {
					setRemainingTime(0);
					if (cooldownTimerRef.current) {
						clearInterval(cooldownTimerRef.current);
						cooldownTimerRef.current = null;
					}
					cleanupExpiredEntries();
				} else {
					setRemainingTime(remaining);
				}
			};

			updateRemainingTime();

			cooldownTimerRef.current = setInterval(updateRemainingTime, 1000);
		},
		[saveCacheToStorage, email, cleanupExpiredEntries]
	);

	const checkCooldown = useCallback(
		(emailValue: string): boolean => {
			const lastSentTime = otpCacheRef.current.get(emailValue);

			if (!lastSentTime) {
				return true;
			}

			const currentTime = Date.now();
			const elapsedSeconds = Math.floor((currentTime - lastSentTime) / 1000);
			const remainingSeconds = OTP_COOLDOWN_SECONDS - elapsedSeconds;

			if (remainingSeconds > 0) {
				Toast.show({
					type: 'error',
					text1: t('setPhoneModal.tooFast', { seconds: remainingSeconds })
				});
				return false;
			}

			return true;
		},
		[t]
	);

	const handleAddEmail = useCallback(async () => {
		if (!checkCooldown(email?.trim() || '')) {
			return;
		}

		if (currentEmail === email?.trim()) {
			Toast.show({
				type: 'error',
				text1: t('emailSetting.updateEmail.emailAlreadyLinked')
			});
			return;
		}

		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const response = await dispatch(
				accountActions.linkEmail({
					data: {
						email: email?.trim() || ''
					} as ApiAccountEmail,
					isMobile: true
				})
			);
			const requestId = response?.payload?.reqId;

			if (response?.meta?.requestStatus === 'fulfilled' && requestId) {
				startCooldownTimer(email?.trim() || '');

				navigation.navigate('ROUTES.SETTINGS.VERIFY_EMAIL', {
					email: email?.trim() || '',
					requestId
				});
			} else {
				Toast.show({
					type: 'error',
					text1: t('emailSetting.updateEmail.failed'),
					text2: response?.payload?.message || ''
				});
			}
		} catch (error) {
			console.error('Error update new email: ', error);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [checkCooldown, email, t, startCooldownTimer]);

	const isFormValid = useMemo(() => {
		return isValidEmail && email?.trim()?.length > 0;
	}, [email, isValidEmail]);

	const renderEmailIcon = useCallback(() => {
		return <MezonIconCDN icon={IconCDN.mailIcon} customStyle={styles.iconDimension} color={themeValue.text} />;
	}, []);

	useEffect(() => {
		return () => {
			if (cooldownTimerRef.current) {
				clearInterval(cooldownTimerRef.current);
			}
			saveCacheToStorage();
		};
	}, [saveCacheToStorage]);

	return (
		<View style={styles.container}>
			<View style={styles.contentContainer}>
				<Text style={styles.label}>{t('emailSetting.updateEmail.newEmail')}</Text>
				<MezonInput
					value={email}
					onTextChange={handleEmailChange}
					inputStyle={styles.input}
					keyboardType="email-address"
					placeHolder={t('emailSetting.updateEmail.newEmail')}
					prefixIcon={renderEmailIcon()}
					inputWrapperStyle={styles.inputWrapperPrefix}
					autoFocus
				/>
				<View style={styles.errorContainer}>{!isValidEmail && <ErrorInput errorMessage={t('emailSetting.updateEmail.invalidEmail')} />}</View>
			</View>

			<MezonButton
				titleStyle={styles.buttonTitle}
				title={t('emailSetting.updateEmail.nextButton')}
				onPress={handleAddEmail}
				containerStyle={[styles.nextButton, isFormValid && styles.nextButtonActive]}
				disabled={!isFormValid}
			/>
		</View>
	);
});
