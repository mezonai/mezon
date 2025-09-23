'use client';
import { authActions, useAppDispatch } from '@mezon/store';
import { Button, FormError, Input, PasswordInput } from '@mezon/ui';
import type { LoadingStatus } from '@mezon/utils';
import { validateEmail, validatePassword } from '@mezon/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface SetPasswordProps {
	onSubmit?: (data: { email: string; password: string; oldPassword?: string }) => void;
	title?: string;
	description?: string;
	submitButtonText?: string;
	initialEmail?: string;
	isLoading?: LoadingStatus;
	onClose?: () => void;
	hasPassword?: boolean;
}

export default function SetPassword({
	onSubmit,
	title,
	description,
	submitButtonText,
	initialEmail = '',
	isLoading,
	onClose,
	hasPassword
}: SetPasswordProps) {
	const { t } = useTranslation('accountSetting');
	const dispatch = useAppDispatch();

	const translatePasswordError = useCallback(
		(errorCode: string) => {
			if (!errorCode) return '';
			return t(`setPasswordAccount.error.${errorCode}`);
		},
		[t]
	);
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState('');
	const [oldPassword, setOldPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	useEffect(() => {
		dispatch(authActions.refreshStatus());
	}, [dispatch]);

	const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);

		setErrors((prev) => ({
			...prev,
			email: validateEmail(value)
		}));
	}, []);

	const handlePasswordChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setPassword(value);

			setErrors((prev) => ({
				...prev,
				password: translatePasswordError(validatePassword(value)),
				confirmPassword: confirmPassword && value !== confirmPassword ? t('setPasswordAccount.error.notEqual') : ''
			}));
		},
		[confirmPassword, translatePasswordError, t]
	);

	const handleCurrentPassword = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setOldPassword(value);
		},
		[confirmPassword]
	);

	const handleConfirmPasswordChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setConfirmPassword(value);

			setErrors((prev) => ({
				...prev,
				confirmPassword: value !== password ? t('setPasswordAccount.error.notEqual') : ''
			}));
		},
		[password, t]
	);

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			if (!hasPassword && !oldPassword) {
				toast.warn('Please fill current password.');
				return;
			}
			event.preventDefault();
			const emailError = validateEmail(email);
			const passwordError = translatePasswordError(validatePassword(password));
			const confirmError = password !== confirmPassword ? t('setPasswordAccount.error.notEqual') : '';

			if (emailError || passwordError || confirmError || oldPassword === password) {
				setErrors({
					email: emailError,
					password: oldPassword === password ? t('setPasswordAccount.error.samePass') : passwordError,
					confirmPassword: confirmError
				});
				return;
			}

			if (onSubmit) {
				onSubmit({ email, password, oldPassword });
			}
		},
		[email, password, confirmPassword, onSubmit, translatePasswordError, t, oldPassword]
	);

	const disabled =
		!!errors.email || !!errors.password || !!errors.confirmPassword || !email || !password || !confirmPassword || isLoading === 'loading';

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
			<div className="w-full max-w-md bg-white rounded-lg shadow-sm relative dark:bg-[#313338] dark:text-white ">
				<button
					onClick={onClose}
					title={t('setPasswordModal.close')}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-300 dark:hover:text-gray-100"
				>
					✕
				</button>

				<div className="p-6 border-b border-gray-200 dark:border-gray-600">
					<div className="text-xl font-semibold text-gray-900 dark:text-white">{title || t('setPasswordModal.title')}</div>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{description || t('setPasswordModal.description')}</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 p-6">
						{hasPassword && (
							<PasswordInput
								id="current-password"
								label={t('setPasswordAccount.currentPassword')}
								value={oldPassword}
								onChange={handleCurrentPassword}
							/>
						)}
						<div className="space-y-2">
							<label htmlFor="email" className="block text-sm font-medium text-black dark:text-gray-300">
								{t('setPasswordAccount.email')}
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={handleEmailChange}
								placeholder={t('setPasswordModal.emailPlaceholder')}
								className={`dark:bg-[#1e1e1e] dark:border-gray-600 dark:placeholder-gray-400 ${errors.email ? 'border-red-500 dark:border-red-400' : ''}`}
								readOnly={true}
								autoComplete="off"
							/>
							{errors.email && <FormError message={errors.email} />}
						</div>

						<div className="space-y-2">
							<PasswordInput
								id="password"
								label={t('setPasswordAccount.password')}
								value={password}
								onChange={handlePasswordChange}
								error={errors.password}
							/>
							<p className="text-sm text-gray-500 mt-2 dark:text-gray-400">{t('setPasswordAccount.description')}</p>
						</div>

						<PasswordInput
							id="confirmPassword"
							label={t('setPasswordAccount.confirmPassword')}
							value={confirmPassword}
							onChange={handleConfirmPasswordChange}
							error={errors.confirmPassword}
						/>
					</div>
					<div className="p-6">
						<Button
							type="submit"
							disabled={disabled}
							className={`w-full px-4 py-2 rounded-md font-medium focus:outline-none
								${
									disabled
										? 'bg-gray-400 text-white cursor-not-allowed dark:bg-gray-600 dark:text-gray-300'
										: 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer dark:bg-indigo-500 dark:hover:bg-indigo-600'
								}`}
						>
							{isLoading === 'loading' ? t('setPasswordModal.loading') : submitButtonText || t('setPasswordAccount.confirm')}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
