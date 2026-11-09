import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
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
			className={`mz-hover flex flex-col rounded-sm text-theme-primary ${disabled ? 'cursor-default' : 'cursor-pointer text-theme-primary-hover bg-item-theme-hover'} px-2 group/mzi`}
			data-e2e={generateE2eId('short_profile.action.button.status')}
		>
			<div className="flex items-center justify-between">
				{startIcon && (
					<div className="flex items-center justify-center h-[18px] w-[18px] mr-2" data-e2e={generateE2eId('icon.profile_status')}>
						{startIcon}
					</div>
				)}
				<li className="text-[14px] w-full py-[6px] list-none">{children}</li>
				{isdoNotDisturb && (
					<MezonIcon
						icon={MzIcons16.mzBellOff}
						className={`mx-3 text-[var(--mz-icon)] ${disabled ? '' : 'group-hover/mzi:text-[var(--mz-icon-selected)]'}`}
					/>
				)}
				{dropdown && (
					<MezonIcon
						icon={MzIcons20.mzChevronRight}
						className={`text-[var(--mz-icon)] ${disabled ? '' : 'group-hover/mzi:text-[var(--mz-icon-selected)]'}`}
					/>
				)}
			</div>
			{description && <p className="text-[10px] relative top-[-8px] mx-6 ">{description}</p>}
		</div>
	);
};

export default ItemStatus;
