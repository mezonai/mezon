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
			className={`flex items-center w-full rounded-lg justify-between  ${danger ? 'hover:bg-[#f67e882a]' : 'bg-item-theme-hover'}  pr-2`}
			data-e2e={generateE2eId(`chat.direct_message.menu.leave_group.button`)}
		>
			<li
				className={`text-[14px]  ${danger ? 'text-[#E13542] text-sm ' : 'text-theme-primary text-theme-primary-hover'}  w-full p-2 text-left cursor-pointer list-none text-ellipsis font-sans text-sm font-normal`}
			>
				{children}
			</li>
		</button>
	);
};

export default ItemPanelMember;
