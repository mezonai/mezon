/* eslint-disable @nx/enforce-module-boundaries */
import { load, save } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { accountActions, useAppDispatch } from '@mezon/store-mobile';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonButton from '../../../../componentUI/MezonButton';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../componentUI/MezonInput';
import { ErrorInput } from '../../../../components/ErrorInput';
import { IconCDN } from '../../../../constants/icon_cdn';
import type { ICountry } from '../../../home/homedrawer/components/CountryDropdown';
import { CountryDropdown, countries } from '../../../home/homedrawer/components/CountryDropdown';
import { style } from './styles';

const OTP_COOLDOWN_SECONDS = 60;
const OTP_CACHE_STORAGE_KEY = '@otp_cooldown_cache';

export const UpdatePhoneNumber = memo(({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue } = useTheme();
	const currentPhone = route?.params?.currentPhone || '';
	const { t } = useTranslation('accountSetting');
	const styles = style(themeValue);
	const dispatch = useAppDispatch();

	const [selectedCountry, setSelectedCountry] = useState<ICountry>(countries[0]);
	const [phoneNumber, setPhoneNumber] = useState<string>('');
	const [isShowDropdown, setIsShowDropdown] = useState<boolean>(false);
	const [isValidPhoneNumber, setIsValidPhoneNumber] = useState<boolean | null>(null);
	const [remainingTime, setRemainingTime] = useState<number>(0);
	const [isCacheLoaded, setIsCacheLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (currentPhone) {
			const country = countries.find((c) => currentPhone.startsWith(c.prefix));
			if (country) {
				setSelectedCountry(country);
				const processedPhone = currentPhone.replace(country.prefix, '');
				setPhoneNumber(processedPhone);
				setIsValidPhoneNumber(true);
			}
		}
	}, [currentPhone]);

	const otpCacheRef = useRef<Map<string, number>>(new Map());
	const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const loadCache = async () => {
			try {
				const cachedData = await load(OTP_CACHE_STORAGE_KEY);
				if (cachedData) {
					const parsed = JSON.parse(cachedData);
					const currentTime = Date.now();

					// Filter out expired entries and load valid ones
					const validEntries: [string, number][] = [];
					Object.entries(parsed).forEach(([phone, timestamp]) => {
						const elapsed = Math.floor((currentTime - (timestamp as number)) / 1000);
						if (elapsed < OTP_COOLDOWN_SECONDS) {
							validEntries.push([phone, timestamp as number]);
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

		otpCacheRef.current.forEach((timestamp, phone) => {
			const elapsed = Math.floor((currentTime - timestamp) / 1000);
			if (elapsed >= OTP_COOLDOWN_SECONDS) {
				otpCacheRef.current.delete(phone);
				hasChanges = true;
			}
		});

		if (hasChanges) {
			await saveCacheToStorage();
		}
	}, [saveCacheToStorage]);

	const toggleShowCountryDropdown = () => {
		setIsShowDropdown(!isShowDropdown);
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

	const handleCountrySelect = useCallback(
		(country: ICountry) => {
			setSelectedCountry(country);
			setIsShowDropdown(false);
			setIsValidPhoneNumber(checkValidPhoneNumber(phoneNumber, country.prefix));
			let processedPhoneNumber = phoneNumber;
			if (country.prefix === '+84' && phoneNumber.startsWith('0')) {
				processedPhoneNumber = phoneNumber.substring(1);
			}
			const fullPhoneNumber = `${country.prefix}${processedPhoneNumber}`;

			const lastSentTime = otpCacheRef.current.get(fullPhoneNumber);
			if (lastSentTime) {
				const elapsed = Math.floor((Date.now() - lastSentTime) / 1000);
				const remaining = OTP_COOLDOWN_SECONDS - elapsed;
				setRemainingTime(remaining > 0 ? remaining : 0);
			} else {
				setRemainingTime(0);
			}
		},
		[phoneNumber, checkValidPhoneNumber]
	);

	const handlePhoneNumberChange = useCallback(
		(value: string) => {
			setPhoneNumber(value);
			setIsValidPhoneNumber(checkValidPhoneNumber(value));
			if (!isCacheLoaded) return;

			let processedPhoneNumber = value;
			if (selectedCountry.prefix === '+84' && value.startsWith('0')) {
				processedPhoneNumber = value.substring(1);
			}
			const fullPhoneNumber = `${selectedCountry.prefix}${processedPhoneNumber}`;

			const lastSentTime = otpCacheRef.current.get(fullPhoneNumber);
			if (lastSentTime) {
				const elapsed = Math.floor((Date.now() - lastSentTime) / 1000);
				const remaining = OTP_COOLDOWN_SECONDS - elapsed;
				setRemainingTime(remaining > 0 ? remaining : 0);

				if (remaining > 0 && !cooldownTimerRef.current) {
					if (cooldownTimerRef.current) {
						clearInterval(cooldownTimerRef.current);
					}
					cooldownTimerRef.current = setInterval(() => {
						const currentLastSentTime = otpCacheRef.current.get(fullPhoneNumber);
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
		[checkValidPhoneNumber, selectedCountry.prefix, isCacheLoaded, cleanupExpiredEntries]
	);

	const startCooldownTimer = useCallback(
		async (fullPhoneNumber: string) => {
			const currentTime = Date.now();
			otpCacheRef.current.set(fullPhoneNumber, currentTime);

			await saveCacheToStorage();

			if (cooldownTimerRef.current) {
				clearInterval(cooldownTimerRef.current);
			}

			const updateRemainingTime = () => {
				let processedPhoneNumber = phoneNumber;
				if (selectedCountry.prefix === '+84' && phoneNumber.startsWith('0')) {
					processedPhoneNumber = phoneNumber.substring(1);
				}
				const currentFullPhone = `${selectedCountry.prefix}${processedPhoneNumber}`;

				const lastSentTime = otpCacheRef.current.get(currentFullPhone);
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
		[phoneNumber, selectedCountry.prefix, saveCacheToStorage, cleanupExpiredEntries]
	);

	const checkCooldown = useCallback(
		(fullPhoneNumber: string): boolean => {
			const lastSentTime = otpCacheRef.current.get(fullPhoneNumber);

			if (!lastSentTime) {
				return true;
			}

			const currentTime = Date.now();
			const elapsedSeconds = Math.floor((currentTime - lastSentTime) / 1000);
			const remainingSeconds = OTP_COOLDOWN_SECONDS - elapsedSeconds;

			if (remainingSeconds > 0) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('setPhoneModal.tooFast', { seconds: remainingSeconds }),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
					}
				});
				return false;
			}

			return true;
		},
		[t]
	);

	const handleAddPhoneNumber = useCallback(async () => {
		let processedPhoneNumber = phoneNumber;
		if (selectedCountry.prefix === '+84' && phoneNumber.startsWith('0')) {
			processedPhoneNumber = phoneNumber.substring(1);
		}
		const fullPhoneNumber = `${selectedCountry.prefix}${processedPhoneNumber}`;

		if (!checkCooldown(fullPhoneNumber)) {
			return;
		}

		if (currentPhone === fullPhoneNumber) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('setPhoneModal.alreadyLinked'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
				}
			});
			return;
		}
		try {
			const response = await dispatch(accountActions.addPhoneNumber({ phone_number: fullPhoneNumber }));
			const requestId = response?.payload?.req_id;

			// todo: recheck
			if (response?.payload?.status === 400) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('setPhoneModal.alreadyLinkedToAnother'),
						leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.red} />
					}
				});
				return false;
			}
			if (response?.meta?.requestStatus === 'fulfilled' && requestId) {
				// Start cooldown timer for this phone number after successful OTP send
				startCooldownTimer(fullPhoneNumber);

				navigation.navigate('ROUTES.SETTINGS.VERIFY_PHONE_NUMBER', {
					phoneNumber: fullPhoneNumber,
					requestId
				});
				setIsShowDropdown(false);
			} else {
				Toast.show({
					type: 'error',
					text1: t('phoneNumberSetting.updatePhoneNumber.failed')
				});
			}
		} catch (error) {
			console.error('Error add phone number: ', error);
		}
	}, [selectedCountry.prefix, phoneNumber, t, checkCooldown, startCooldownTimer, dispatch, navigation]);

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
				<Text style={styles.label}>{t('phoneNumberSetting.updatePhoneNumber.newPhoneNumber')}</Text>

				<View style={styles.phoneContainer}>
					<TouchableOpacity style={styles.countryButton} onPress={toggleShowCountryDropdown}>
						<MezonIconCDN icon={selectedCountry.icon} useOriginalColor customStyle={styles.customStyleFlagIcon} />
						<Text style={styles.input}>{selectedCountry.prefix}</Text>
					</TouchableOpacity>

					<View style={{ flex: 1 }}>
						<MezonInput
							value={phoneNumber}
							onTextChange={handlePhoneNumberChange}
							inputStyle={styles.input}
							inputWrapperStyle={styles.inputWrapper}
							keyboardType="phone-pad"
							autoFocus
						/>
					</View>
					<CountryDropdown onCountrySelect={handleCountrySelect} isVisible={isShowDropdown} selectedCountry={selectedCountry} />
				</View>

				<View style={styles.errorContainer}>
					{isValidPhoneNumber === false && (
						<ErrorInput errorMessage={t('phoneNumberSetting.updatePhoneNumber.invalidPhoneNumber')} style={styles.errorInput} />
					)}
				</View>
			</View>

			<MezonButton
				titleStyle={styles.buttonTitle}
				title={t('phoneNumberSetting.updatePhoneNumber.nextButton')}
				onPress={handleAddPhoneNumber}
				containerStyle={[styles.nextButton, isValidPhoneNumber ? styles.nextButtonActive : {}]}
				disabled={!isValidPhoneNumber}
			/>
		</View>
	);
});
