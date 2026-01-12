import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
	size?: number | string;
}

export const ObjectIcon: React.FC<IconProps> = ({ className = 'w-4 h-4 text-white', ...props }) => {
	return (
		<svg
			viewBox="0 0 24 24"
			width="12px"
			height="12px"
			className={className}
			{...props}
			aria-hidden="true"
			focusable="false"
			role="img"
			data-icon="box"
		>
			<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
				<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
				<path d="m3.3 7l8.7 5l8.7-5M12 22V12"></path>
			</g>
		</svg>
	);
};

export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" width="12px" height="12px" className={className} aria-hidden="true" focusable="false" role="img" {...props}>
			<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
				<path d="M8 2v4m8-4v4"></path>
				<rect width="18" height="18" x="3" y="4" rx="2"></rect>
				<path d="M3 10h18"></path>
			</g>
		</svg>
	);
};

export const ListIcon: React.FC<IconProps> = ({ className = 'w-4 h-4 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" width="12px" height="12px" className={className} aria-hidden="true" focusable="false" role="img" {...props}>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"
			></path>
		</svg>
	);
};

export const StringIcon: React.FC<IconProps> = ({ className = 'w-4 h-4 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" width="12px" height="12px" className={className} aria-hidden="true" focusable="false" role="img" {...props}>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M12 4v16M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M9 20h6"
			></path>
		</svg>
	);
};

export const NumberIcon: React.FC<IconProps> = ({ className = 'w-4 h-4 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" width="12px" height="12px" className={className} aria-hidden="true" focusable="false" role="img" {...props}>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M4 9h16M4 15h16M10 3L8 21m8-18l-2 18"
			></path>
		</svg>
	);
};

export const BooleanIcon: React.FC<IconProps> = ({ className = 'w-4 h-4 text-white', ...props }) => {
	return (
		<svg viewBox="0 0 24 24" width="12px" height="12px" className={className} aria-hidden="true" focusable="false" role="img" {...props}>
			<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
				<rect width="18" height="18" x="3" y="3" rx="2"></rect>
				<path d="m9 12l2 2l4-4"></path>
			</g>
		</svg>
	);
};
