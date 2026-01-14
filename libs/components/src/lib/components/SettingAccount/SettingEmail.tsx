'use client';
import { accountActions, authActions, useAppDispatch } from '@mezon/store';
import { Button, ButtonLoading, Input, PasswordInput } from '@mezon/ui';
import type { LoadingStatus } from '@mezon/utils';
import { validateEmail, validatePassword } from '@mezon/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { OtpConfirm } from './SettingPhone';

interface SetEmailProps {
	submitButtonText?: string;
	isLoading?: LoadingStatus;
	onClose?: () => void;
}

export default function SetEmail({ submitButtonText, isLoading, onClose }: SetEmailProps) {
	const { t } = useTranslation('accountSetting');
	const dispatch = useAppDispatch();
	const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
	const [reqId, setReqId] = useState('');
	const [count, setCount] = useState<number | null>(null);

	const translatePasswordError = useCallback(
		(errorCode: string) => {
			if (!errorCode) return '';
			return t(`setPasswordAccount.error.${errorCode}`);
		},
		[t]
	);

	const translateEmailError = useCallback(
		(errorCode: string) => {
			if (!errorCode) return '';
			return t(`emailSetting.error.${errorCode}`);
		},
		[t]
	);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	useEffect(() => {
		dispatch(authActions.refreshStatus());
	}, [dispatch]);

	const handleEmailChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setEmail(value);

			setErrors((prev) => ({
				...prev,
				email: translateEmailError(validateEmail(value))
			}));
		},
		[translateEmailError]
	);

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

	const handleConfirmPasswordChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setConfirmPassword(value);

			setErrors((prev) => ({
				...prev,
				confirmPassword: value !== password ? t('emailSetting.error.notEqual') : ''
			}));
		},
		[password, t]
	);

	const handleSendOtp = useCallback(async (otp: string) => {
		if (reqId) {
			await dispatch(authActions.confirmAuthenticateOTP({ otp_code: otp, req_id: reqId })).unwrap();
			return;
		}
		onClose?.();
	}, []);

	const handleSubmit = useCallback(async () => {
		if (errors.email || (count !== null && count > 0)) {
			return;
		}

		if (!reqId || count === 0) {
			const response = await dispatch(
				accountActions.linkEmail({
					data: {
						email,
						password
					}
				})
			).unwrap();
			if (response && response?.req_id) {
				setReqId(response.req_id);
				setCount(60);
			} else {
				toast.error('');
			}
		} else if (otp.join('').length === 6) {
			handleSendOtp(otp.join(''));
		}
	}, [email, password, confirmPassword, translatePasswordError, t, reqId, otp, count]);
	const handleSetOTP = (e: string[]) => {
		setOtp(e);
	};

	const disabled = !!errors.email || !email || isLoading === 'loading';

	useEffect(() => {
		if (!reqId) return;

		if (otp.join('').length === 6) {
			handleSendOtp(otp.join(''));
		}
	}, [otp, reqId]);

	useEffect(() => {
		if (count === null) return;
		const timer = setInterval(() => {
			setCount(() => {
				if (count <= 1) {
					clearInterval(timer);
					return 0;
				}
				return count - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [count]);

	const handleOnclose = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.preventDefault();
		e.stopPropagation();
		onClose?.();
	};
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
			<div className="w-full max-w-md rounded-lg shadow-sm relative bg-theme-setting-primary text-theme-primary overflow-hidden">
				<button
					onClick={onClose}
					title={t('setPasswordModal.close')}
					className="absolute top-4 right-4  focus:outline-none text-theme-primary-active hover:text-red-500"
				>
					✕
				</button>

				<div className="p-6 border-b bg-theme-setting-nav">
					<div className="text-xl font-semibold text-theme-primary">{reqId ? t('emailSetting.fillOTP') : t('setEmail')}</div>
					<p className="mt-1 text-sm text-theme-primary">{reqId ? t('emailSetting.otpDescription') : t('emailSetting.description')}</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 p-6">
						{reqId ? (
							<div className={`flex flex-col gap-2`}>
								<OtpConfirm otp={otp} handleSetOTP={handleSetOTP} className="pr-[5px]" />
							</div>
						) : (
							<>
								<Input
									id="new-email"
									label={t('emailSetting.updateEmail.newEmail')}
									value={email}
									onChange={handleEmailChange}
									className={`w-full px-3 py-2 rounded-md pr-10 border bg-theme-input text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.email ? 'border-red-500 dark:border-red-400' : 'border-theme-primary'}`}
									placeholder={'example@gmail.com'}
									error={errors.email}
								/>

								<div className="space-y-2">
									<PasswordInput
										id="password"
										label={t('setPasswordAccount.password')}
										value={password}
										onChange={handlePasswordChange}
										error={errors.password}
										className="p-1"
									/>
								</div>
								<PasswordInput
									id="confirmPassword"
									label={t('setPasswordAccount.confirmPassword')}
									value={confirmPassword}
									onChange={handleConfirmPasswordChange}
									error={errors.confirmPassword}
									className="p-1"
								/>
							</>
						)}
					</div>
					<div className="p-6 flex gap-2 p-1">
						<Button className="w-full h-10 rounded-md bg-theme-input" onClick={handleOnclose}>
							{t('emailSetting.cancel')}
						</Button>
						<ButtonLoading
							className="w-full h-10 btn-primary btn-primary-hover"
							disabled={!reqId ? !!errors.email || errors.email === undefined || disabled : disabled || (count !== null && count > 0)}
							label={`${!reqId ? t('emailSetting.send') : t('emailSetting.resendOtp')} ${count ? `(${count})` : ''}`}
							onClick={handleSubmit}
						/>
					</div>
				</form>
			</div>
		</div>
	);
}
