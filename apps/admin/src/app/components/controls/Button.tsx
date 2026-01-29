import React from 'react';

type Props = {
	onClick?: () => void;
	children: React.ReactNode;
	className?: string;
	type?: 'button' | 'submit' | 'reset';
};

export default function Button({ onClick, children, className = '', type = 'button' }: Props) {
	const base = 'w-full sm:w-36 px-6 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752c4] focus:outline-none focus:ring-2 focus:ring-blue-500';
	return (
		<button type={type} onClick={onClick} className={`${base} ${className}`.trim()}>
			{children}
		</button>
	);
}
