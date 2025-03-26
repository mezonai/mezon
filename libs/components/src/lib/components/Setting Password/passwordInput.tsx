'use client';

import { Icons } from '@mezon/ui';
import type React from 'react';
import { memo, useState } from 'react';
import { FormError } from './formError';

interface PasswordInputProps {
	id: string;
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	error?: string;
	isLoading?: boolean;
}

export const PasswordInput = memo(({ id, label, value, onChange, error, isLoading }: PasswordInputProps) => {
	const [showPassword, setShowPassword] = useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	return (
		<div className="space-y-2">
			<label htmlFor={id} className="block text-sm font-medium text-gray-900 dark:text-gray-200">
				{label}
			</label>
			<div className="relative">
				<input
					id={id}
					type={showPassword ? 'text' : 'password'}
					value={value}
					onChange={onChange}
					className={`w-full px-3 py-2 rounded-md pr-10 border 
						${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} 
						bg-white dark:bg-[#1e1e1e]
						text-black dark:text-white 
						focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
					readOnly={isLoading}
					autoComplete="off"
					placeholder={label === 'Password' ? 'Enter your password' : 'Confirm your password'}
				/>
				<button
					type="button"
					onClick={togglePasswordVisibility}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
				>
					{showPassword ? <Icons.EyeClose className="w-5 h-5" /> : <Icons.EyeOpen className="w-5 h-5" />}
				</button>
			</div>
			{error && <FormError message={error} />}
		</div>
	);
});
