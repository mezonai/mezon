import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'dangerouslySetInnerHTML'> {
	className?: string;
	children?: ReactNode;
	label?: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	icon?: ReactNode;
	iconPosition?: 'left' | 'right';
	fullWidth?: boolean;
	rounded?: boolean;
	noNeedOpacity?: boolean;
}

const getButtonClasses = (
	variant: ButtonVariant,
	size: ButtonSize,
	disabled: boolean,
	loading: boolean,
	fullWidth: boolean,
	rounded: boolean,
	noNeedOpacity: boolean,
	className?: string
): string => {
	const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: disabled ? `text-theme-disabled ${noNeedOpacity ? 'btn-theme-primary' : 'opacity-50'} cursor-not-allowed` : 'btn-theme-primary',
		secondary: disabled ? 'text-theme-disabled btn-theme-secondary opacity-50 cursor-not-allowed' : 'btn-theme-secondary',
		success: disabled ? 'text-theme-disabled btn-theme-success opacity-50 cursor-not-allowed' : 'btn-theme-success',
		danger: disabled ? 'text-theme-disabled btn-theme-danger opacity-50 cursor-not-allowed' : 'btn-theme-danger',
		warning: disabled ? 'text-theme-disabled btn-theme-warning opacity-50 cursor-not-allowed' : 'btn-theme-warning',
		ghost: disabled ? 'text-theme-disabled cursor-not-allowed' : 'btn-theme-ghost',
		link: disabled
			? 'text-theme-disabled cursor-not-allowed'
			: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:ring-blue-500'
	};

	const sizeClasses = {
		xs: 'px-2 py-1 text-xs rounded',
		sm: 'px-3 py-1.5 text-sm rounded',
		md: 'px-4 py-2 text-sm rounded-md',
		lg: 'px-6 py-3 text-base rounded-md',
		xl: 'px-8 py-4 text-lg rounded-lg'
	};

	const widthClasses = fullWidth ? 'w-full' : '';
	const roundedClasses = rounded ? 'rounded-full' : '';

	return [baseClasses, variantClasses[variant], sizeClasses[size], widthClasses, roundedClasses, className].filter(Boolean).join(' ');
};

const Button: React.FC<ButtonProps> = ({
	className,
	children,
	label,
	variant = 'primary',
	size = 'md',
	disabled = false,
	loading = false,
	icon,
	iconPosition = 'left',
	fullWidth = false,
	rounded = false,
	noNeedOpacity = false,
	...rest
}) => {
	const isDisabled = disabled || loading;

	const buttonClasses = getButtonClasses(variant, size, isDisabled, loading, fullWidth, rounded, noNeedOpacity, className);

	const LoadingSpinner = () => (
		<svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	);

	const renderContent = () => {
		const text = children || label;

		if (loading) {
			return (
				<>
					<LoadingSpinner />
					{text}
				</>
			);
		}

		if (icon && iconPosition === 'left') {
			return (
				<>
					<span className="mr-2">{icon}</span>
					{text}
				</>
			);
		}

		if (icon && iconPosition === 'right') {
			return (
				<>
					{text}
					<span className="ml-2">{icon}</span>
				</>
			);
		}

		return text;
	};

	return (
		<button className={buttonClasses} disabled={isDisabled} {...rest}>
			{renderContent()}
		</button>
	);
};

export default Button;
