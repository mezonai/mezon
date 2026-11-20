import { generateE2eId } from '@mezon/utils';
import type { CSSProperties, ReactNode } from 'react';

type ItemModalProps = {
	children: string;
	endIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	style?: CSSProperties;
};

const ItemModal = ({ children, endIcon, onClick, disabled, className, style }: ItemModalProps) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			style={style}
			className={`mz-hover flex items-center w-full justify-between rounded-sm group pr-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'bg-item-theme-hover'} ${className} group/mzi`}
			data-e2e={generateE2eId(`clan_page.header.modal_panel.item`)}
		>
			<li
				className={`text-[14px] font-medium w-full py-[6px] px-[8px] text-left list-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
			>
				{children}
			</li>
			{endIcon && <div className="flex shrink-0 items-center justify-center h-[18px] w-[18px]">{endIcon}</div>}
		</button>
	);
};

export default ItemModal;
