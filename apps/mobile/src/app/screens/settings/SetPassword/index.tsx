import { baseColor, useTheme } from '@mezon/mobile-ui';
import { accountActions, appActions, authActions, selectAllAccount, useAppDispatch } from '@mezon/store-mobile';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StatusBar, Text } from 'react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { TextInputUser } from '../../../components/auth/TextInput';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

const SetPassword = ({ navigation }) => {
	const { t } = useTranslation(['accountSetting']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [currentPassword, setCurrentPassword] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');
	const [errors, setErrors] = useState<{
		email?: string;
		currentPassword?: string;
		password?: string;
		confirmPassword?: string;
	}>({});
	const dispatch = useAppDispatch();

	const userProfile = useSelector(selectAllAccount);
	const hasPassword = !!userProfile?.password_setted;

	const handleCurrentPasswordChange = (currentPasswordText: string) => {
		setCurrentPassword(currentPasswordText);
		setErrors((prev) => {
			const newPasswordError =
				currentPasswordText && password && currentPasswordText === password
					? t('setPasswordAccount.error.samePass')
					: validatePassword(password);
			return {
				...prev,
				password: password ? newPasswordError : ''
			};
		});
	};

	const handlePasswordChange = (passwordText: string) => {
		setPassword(passwordText);

		setErrors((prev) => ({
			...prev,
			password:
				currentPassword && passwordText && currentPassword === passwordText
					? t('setPasswordAccount.error.samePass')
					: validatePassword(passwordText),
			confirmPassword: confirmPassword && passwordText !== confirmPassword ? t('setPasswordAccount.error.notEqual') : ''
		}));
	};

	const handleConfirmPasswordChange = (passwordText: string) => {
		setConfirmPassword(passwordText);

		setErrors((prev) => ({
			...prev,
			confirmPassword: passwordText !== password ? t('setPasswordAccount.error.notEqual') : ''
		}));
	};

	const validatePassword = useCallback(
		(value: string) => {
			if (value.length < 8) {
				return t('setPasswordAccount.error.characters');
			}
			if (!/[A-Z]/.test(value)) {
				return t('setPasswordAccount.error.uppercase');
			}
			if (!/[a-z]/.test(value)) {
				return t('setPasswordAccount.error.lowercase');
			}
			if (!/[0-9]/.test(value)) {
				return t('setPasswordAccount.error.number');
			}
			if (!/[^A-Za-z0-9]/.test(value)) {
				return t('setPasswordAccount.error.symbol');
			}
			return '';
		},
		[t]
	);

	const handleSubmit = useCallback(async () => {
		const passwordError = validatePassword(password);
		const confirmError = password !== confirmPassword ? t('setPasswordAccount.error.notEqual') : '';
		const samePass = hasPassword && currentPassword && password && currentPassword === password;

		if (confirmError || passwordError || samePass) {
			setErrors({
				password: samePass ? t('setPasswordAccount.error.samePass') : passwordError,
				confirmPassword: confirmError
			});
			return;
		}

		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const response = await dispatch(
				authActions.registrationPassword({
					email: userProfile?.email,
					password,
					...(hasPassword ? { oldPassword: currentPassword } : {}),
					isMobile: true
				})
			);
			if (response?.meta?.requestStatus === 'fulfilled') {
				dispatch(accountActions.setPasswordSetted(true));
				Toast.show({
					type: 'success',
					props: {
						text2: t('setPasswordAccount.toast.success'),
						leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
					}
				});
				navigation.goBack();
			} else if (response?.meta?.requestStatus === 'rejected') {
				Toast.show({
					type: 'error',
					text1: t('setPasswordAccount.toast.error')
				});
			}
		} catch (error) {
			console.error(error);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [confirmPassword, currentPassword, dispatch, navigation, password, t, userProfile?.email, validatePassword]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () => (
				<Pressable onPress={handleSubmit}>
					<Text style={styles.saveChangeButton}>{t('setPasswordAccount.confirm')}</Text>
				</Pressable>
			)
		});
	}, [handleSubmit, navigation, styles, t]);

	return (
		<KeyboardAvoidingView
			behavior={'padding'}
			style={styles.container}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
		>
			<KeyboardAwareScrollView bottomOffset={100} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
				<TextInputUser
					placeholder={''}
					isPass={false}
					value={userProfile?.email}
					label={t('setPasswordAccount.email')}
					error={errors?.password}
					require={false}
					disable
				/>
				{hasPassword && (
					<TextInputUser
						placeholder={t('setPasswordAccount.placeholder.currentPassword')}
						isPass={true}
						value={currentPassword}
						onChangeText={handleCurrentPasswordChange}
						label={t('setPasswordAccount.currentPassword')}
						error={errors?.currentPassword}
						touched={true}
					/>
				)}
				<TextInputUser
					placeholder={t('setPasswordAccount.placeholder.password')}
					isPass={true}
					value={password}
					onChangeText={handlePasswordChange}
					label={t('setPasswordAccount.password')}
					error={errors?.password}
					touched={true}
				/>
				<Text style={styles.description}>{t('setPasswordAccount.description')}</Text>
				<TextInputUser
					placeholder={t('setPasswordAccount.placeholder.confirmPassword')}
					isPass={true}
					value={confirmPassword}
					onChangeText={handleConfirmPasswordChange}
					label={t('setPasswordAccount.confirmPassword')}
					error={errors?.confirmPassword}
					touched={true}
				/>
			</KeyboardAwareScrollView>
		</KeyboardAvoidingView>
	);
};

export default SetPassword;
