import { generateE2eId } from '@mezon/utils';
import type { ReactNode } from 'react';

type ItemModalProps = {
	children: string;
	endIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
};

const ItemModal = ({ children, endIcon, onClick, disabled, className }: ItemModalProps) => {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`flex items-center w-full justify-between rounded-sm bg-item-theme-hover group pr-2 ${className}`}
			data-e2e={generateE2eId(`clan_page.header.modal_panel.item`)}
		>
			<li className="text-[14px] text-theme-primary-hover font-medium w-full py-[6px] px-[8px] text-left cursor-pointer list-none ">
				{children}
			</li>
			{endIcon && <div className="flex shrink-0 items-center justify-center h-[18px] w-[18px]">{endIcon}</div>}
		</button>
	);
};

export default ItemModal;
