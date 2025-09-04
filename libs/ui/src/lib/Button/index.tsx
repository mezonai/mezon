import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'dangerouslySetInnerHTML'> {
	className?: string;
	children?: React.ReactNode;
	disabled?: boolean;
	variant?: ButtonVariant;
	size?: ButtonSize;
	dataE2E?: string;
}
const Button: React.FC<ButtonProps> = ({ variant, size, disabled, children, className, dataE2E, ...rest }) => {
	return (
		<button
			className={`font-[500] capitalize disabled:opacity-50 disabled:cursor-not-allowed ease-linear transition-all duration-150  ${className}`}
			{...rest}
			disabled={disabled}
			data-e2e={dataE2E}
		>
			{children}
		</button>
	);
};

export default Button;
