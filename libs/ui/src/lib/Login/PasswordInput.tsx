'use client';

import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '../Icons';
import FormError from './FormError';

interface PasswordInputProps {
	id: string;
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	error?: string;
	isLoading?: boolean;
	onFocus?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	className?: string;
}

const PasswordInput = memo(({ id, label, value, onChange, error, isLoading, onFocus, className }: PasswordInputProps) => {
	const { t } = useTranslation('common');
	const [showPassword, setShowPassword] = useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	return (
		<div className={`space-y-2 ${className ? className : ''}`}>
			<label htmlFor={id} className="block text-sm font-medium text-theme-primary">
				{label}
				<span className="text-red-500">*</span>
			</label>
			<div className="relative">
				<input
					id={id}
					type={showPassword ? 'text' : 'password'}
					value={value}
					onChange={onChange}
					className={`w-full px-3 py-2 rounded-md pr-10 border
						${error ? 'border-red-500 dark:border-red-400' : 'border-theme-primary'}
						bg-theme-input
						text-theme-primary
						focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 `}
					readOnly={isLoading}
					autoComplete="off"
					placeholder={label === 'Password' ? t('enterPassword') : t('confirmPassword')}
					onFocus={onFocus}
				/>
				<button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-primary">
					{showPassword ? <Icons.EyeClose className="w-5 h-5" /> : <Icons.EyeOpen className="w-5 h-5" />}
				</button>
			</div>
			{error && <FormError message={error} />}
		</div>
	);
});

export default PasswordInput;
