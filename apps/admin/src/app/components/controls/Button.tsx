import React from 'react';

type Props = {
	onClick?: () => void;
	children: React.ReactNode;
	className?: string;
	type?: 'button' | 'submit' | 'reset';
};

export default function Button({ onClick, children, className = '', type = 'button' }: Props) {
	const base = 'text-[15px] py-[10px] px-[16px] text-white bg-[#5865F2] hover:bg-[#4752c4] cursor-pointer rounded-md text-nowrap';
	return (
		<button type={type} onClick={onClick} className={`${base} ${className}`.trim()}>
			{children}
		</button>
	);
}
