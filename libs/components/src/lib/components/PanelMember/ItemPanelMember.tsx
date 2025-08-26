import { generateE2eId } from '@mezon/utils';

type ItemPanelMemberProps = {
	children: string;
	danger?: boolean;
	onClick?: (e: any) => void;
};

const ItemPanelMember = ({ children, danger, onClick }: ItemPanelMemberProps) => {
	return (
		<button
			onClick={onClick}
			className="flex items-center w-full justify-between rounded-sm bg-item-theme-hover  pr-2"
			data-e2e={generateE2eId(`chat.direct_message.menu.leave_group.button`)}
		>
			<li
				className={`text-[14px]  ${danger ? 'text-colorDanger ' : 'text-theme-primary '} font-medium w-full py-[6px] px-[13px] text-left cursor-pointer list-none`}
			>
				{children}
			</li>
		</button>
	);
};

export default ItemPanelMember;
