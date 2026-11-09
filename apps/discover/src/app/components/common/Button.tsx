import { MzIcons16, SpinningIcon } from '@mezon/ui';
import React from 'react';
import { COLORS } from '../../constants/constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	fullWidth?: boolean;
	isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
	children,
	variant = 'primary',
	size = 'md',
	fullWidth = false,
	isLoading = false,
	className = '',
	disabled,
	...props
}) => {
	const baseStyles =
		'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

	const variants = {
		primary: `bg-[${COLORS.PRIMARY}] hover:bg-[${COLORS.PRIMARY_HOVER}] text-white focus:ring-[${COLORS.PRIMARY}]`,
		secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
		outline: `border-2 border-[${COLORS.PRIMARY}] text-[${COLORS.PRIMARY}] hover:bg-[${COLORS.PRIMARY}] hover:text-white focus:ring-[${COLORS.PRIMARY}]`
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg'
	};

	const width = fullWidth ? 'w-full' : '';

	return (
		<button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`} disabled={disabled || isLoading} {...props}>
			{isLoading ? <SpinningIcon icon={MzIcons16.mzSpinner} className="-ml-1 mr-2 text-current" /> : null}
			{children}
		</button>
	);
};

export default Button;
