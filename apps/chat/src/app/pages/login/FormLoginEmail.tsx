import { authActions, selectLoadingEmail, useAppDispatch } from '@mezon/store';
import { validateEmail } from '@mezon/utils';

import { ButtonLoading, FormError, Input, PasswordInput } from '@mezon/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const FormLoginEmail = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('common');

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const isLoadingLoginEmail = useSelector(selectLoadingEmail);

	const getEmailErrorMessage = useCallback(
		(value: string) => {
			const errorCode = validateEmail(value);
			if (!errorCode) return '';
			if (errorCode === 'required') {
				return t('login.enterEmailToLogin');
			}
			return t('login.invalidCredentials');
		},
		[t]
	);

	const getPasswordErrorMessage = useCallback(
		(value: string) => {
			if (!value) {
				return t('enterPassword');
			}
			return '';
		},
		[t]
	);

	const handleLogin = async ({ email, password }: { email: string; password: string }) => {
		if (!email || !password) {
			console.error('Email and password are required');
			return;
		}

		await dispatch(authActions.authenticateEmail({ email, password }));
	};

	const handleSubmit = useCallback(async () => {
		const emailError = getEmailErrorMessage(email);
		const passwordError = getPasswordErrorMessage(password);

		if (emailError || passwordError) {
			setErrors({ email: emailError, password: passwordError });
			return;
		}

		await handleLogin({ email, password });
	}, [email, password, getEmailErrorMessage, getPasswordErrorMessage]);

	const handleFocus = () => {
		setErrors({});
		dispatch(authActions.refreshStatus());
	};
	const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);

		setErrors((prev) => ({ ...prev, email: undefined }));
	}, []);

	const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setPassword(value);

		setErrors((prev) => ({ ...prev, password: undefined }));
	}, []);

	const showErrLoginFail = isLoadingLoginEmail === 'error';
	useEffect(() => {
		if (showErrLoginFail) {
			setErrors({
				email: t('login.invalidCredentials'),
				password: t('login.invalidCredentials')
			});
		}
	}, [showErrLoginFail, t]);

	const disabled = !!errors.email || !!errors.password || !email || !password || isLoadingLoginEmail !== 'not loaded';

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<div className="h-64 flex flex-col justify-between">
				<div className="flex flex-col gap-2">
					<label htmlFor="email" className="block text-sm font-medium text-black dark:text-gray-300">
						{t('login.email')}
						<span className="text-red-500">*</span>
					</label>
					<Input
						onFocus={handleFocus}
						id="email"
						type="email"
						value={email}
						onChange={handleEmailChange}
						placeholder={t('login.enterEmail')}
						className={`dark:bg-[#1e1e1e] dark:border-gray-600 dark:placeholder-gray-400 text-black dark:text-white`}
						readOnly={false}
					/>
				</div>
				<div className="min-h-[20px]">{errors.email && <FormError message={errors.email} />}</div>
				<div className="flex flex-col gap-2">
					<PasswordInput
						className="h-20"
						onFocus={handleFocus}
						id="password"
						label={t('login.password')}
						value={password}
						onChange={handlePasswordChange}
					/>
				</div>
				<div className="min-h-[20px]">{errors.password && <FormError message={errors.password} />}</div>
				<ButtonLoading
					className="w-full h-10 btn-primary btn-primary-hover"
					disabled={disabled}
					label={t('login.logIn')}
					onClick={handleSubmit}
				/>
			</div>
		</form>
	);
};

export default FormLoginEmail;
