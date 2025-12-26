import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { ReactNode } from 'react';

type ItemStatusProps = {
	children: string;
	dropdown?: boolean;
	type?: 'radio' | 'checkbox' | 'none';
	startIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	description?: string;
	isdoNotDisturb?: boolean;
};

const ItemStatus = ({ children, description, dropdown, startIcon, type, onClick, disabled = false, isdoNotDisturb = false }: ItemStatusProps) => {
	return (
		<div
			onClick={!disabled ? onClick : undefined}
			className={`flex flex-col rounded-sm text-theme-primary ${disabled ? 'cursor-default' : 'cursor-pointer text-theme-primary-hover bg-item-theme-hover'} px-2`}
			data-e2e={generateE2eId('short_profile.action.button.base')}
		>
			<div className="flex items-center justify-between">
				{startIcon && <div className="flex items-center justify-center h-[18px] w-[18px] mr-2">{startIcon}</div>}
				<li className="text-[14px] w-full py-[6px] list-none">{children}</li>
				{isdoNotDisturb && <Icons.MuteBell defaultSize="w-4 h-4 mx-3" />}
				{dropdown && <Icons.RightIcon />}
			</div>
			{description && <p className="text-[10px] relative top-[-8px] mx-6 ">{description}</p>}
		</div>
	);
};

export default ItemStatus;
