import React from 'react';

type FloatButtonProps = {
	content: string;
	onClick: () => void;
	className?: string;
};

export const FloatButton: React.FC<FloatButtonProps> = ({ content, onClick, className }) => {
	return (
		<div
			onClick={onClick}
			className={`shadow-lg text-sm text-white bg-[#DA373C] rounded-full py-1 px-2 w-fit my-2 font-semibold align-center cursor-pointer opacity-90 hover:opacity-95 active:opacity-100 ${className || ''}`}
		>
			{content}
		</div>
	);
};
