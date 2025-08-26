import { generateE2eId } from '@mezon/utils';
import { ReactNode } from 'react';

type ItemModalProps = {
	children: string;
	endIcon?: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
};

const ItemModal = ({ children, endIcon, onClick, disabled, className }: ItemModalProps) => {
	const generateE2eKeyByChildren = () => {
		switch (children) {
			case 'Create Category':
				return generateE2eId(`clan_page.header.modal_panel.create_category`);
			case 'Invite People':
				return generateE2eId(`clan_page.header.modal_panel.invite_people`);
			case 'Clan Settings':
				return generateE2eId(`clan_page.header.modal_panel.clan_settings`);
			case 'Notification Setting':
				return generateE2eId(`clan_page.header.modal_panel.notification_setting`);
			case 'Mark As Read':
				return generateE2eId(`clan_page.header.modal_panel.mark_as_read`);
			default:
				return generateE2eId(`clan_page.header.modal_panel.item`);
		}
	};

	return (
		<button
			data-e2e={generateE2eKeyByChildren()}
			onClick={onClick}
			disabled={disabled}
			className={`flex items-center w-full justify-between rounded-sm bg-item-theme-hover group pr-2 ${className}`}
		>
			<li className="text-[14px] text-theme-primary-hover font-medium w-full py-[6px] px-[8px] text-left cursor-pointer list-none ">
				{children}
			</li>
			{endIcon && <div className="flex items-center justify-center h-[18px] w-[18px]">{endIcon}</div>}
		</button>
	);
};

export default ItemModal;
