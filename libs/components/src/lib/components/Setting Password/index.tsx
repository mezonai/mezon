'use client';
import { ButtonLoading, FormError, Input, PasswordInput } from '@mezon/ui';
import { LoadingStatus, validateEmail, validatePassword } from '@mezon/utils';
import type React from 'react';
import { useCallback, useState } from 'react';

interface SetPasswordProps {
	onSubmit?: (data: { email: string; password: string }) => void;
	title?: string;
	description?: string;
	submitButtonText?: string;
	initialEmail?: string;
	isLoading?: LoadingStatus;
	onClose?: () => void;
}

export default function SetPassword({
	onSubmit,
	title = 'Set Password',
	description = 'Please create a new password for your account',
	submitButtonText = 'Confirm',
	initialEmail = '',
	isLoading,
	onClose
}: SetPasswordProps) {
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

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
				password: validatePassword(value),
				confirmPassword: confirmPassword && value !== confirmPassword ? "Confirmation password doesn't match" : ''
			}));
		},
		[confirmPassword]
	);

	const handleConfirmPasswordChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setConfirmPassword(value);

			setErrors((prev) => ({
				...prev,
				confirmPassword: value !== password ? "Confirmation password doesn't match" : ''
			}));
		},
		[password]
	);

	const handleSubmit = useCallback(() => {
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);
		const confirmError = password !== confirmPassword ? "Confirmation password doesn't match" : '';

		if (emailError || passwordError || confirmError) {
			setErrors({
				email: emailError,
				password: passwordError,
				confirmPassword: confirmError
			});
			return;
		}

		if (onSubmit) {
			onSubmit({ email, password });
		}
	}, [email, password, confirmPassword, onSubmit]);

	const disabled =
		!!errors.email || !!errors.password || !!errors.confirmPassword || !email || !password || !confirmPassword || isLoading === 'loading';

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
			<div className="w-full max-w-md bg-white rounded-lg shadow-sm relative dark:bg-[#313338] dark:text-white ">
				<button
					onClick={onClose}
					title="Close"
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-300 dark:hover:text-gray-100"
				>
					✕
				</button>

				<div className="p-6 border-b border-gray-200 dark:border-gray-600">
					<div className="text-xl font-semibold text-gray-900 dark:text-white">{title}</div>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{description}</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 p-6">
						<div className="space-y-2">
							<label htmlFor="email" className="block text-sm font-medium text-black dark:text-gray-300">
								Email
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={handleEmailChange}
								placeholder="your.email@example.com"
								className={`dark:bg-[#1e1e1e] dark:border-gray-600 dark:placeholder-gray-400 ${errors.email ? 'border-red-500 dark:border-red-400' : ''}`}
								readOnly={true}
								autoComplete="off"
							/>
							{errors.email && <FormError message={errors.email} />}
						</div>

						<div className="space-y-2">
							<PasswordInput id="password" label="Password" value={password} onChange={handlePasswordChange} error={errors.password} />
							<p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
								Your password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one
								number, and one special character (e.g., !@#$%^&*).
							</p>
						</div>

						<PasswordInput
							id="confirmPassword"
							label="Confirm Password"
							value={confirmPassword}
							onChange={handleConfirmPasswordChange}
							error={errors.confirmPassword}
						/>
					</div>
					<div className="p-6">
						<ButtonLoading disabled={disabled} label={submitButtonText} onClick={handleSubmit} />
					</div>
				</form>
			</div>
		</div>
	);
}
