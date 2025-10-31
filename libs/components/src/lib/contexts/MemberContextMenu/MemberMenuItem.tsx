import { generateE2eId } from '@mezon/utils';
import type { FC, ReactNode } from 'react';
import { Item } from 'react-contexify';

interface MemberMenuItemProps {
	label: string;
	onClick: () => void;
	isWarning?: boolean;
	rightElement?: ReactNode;
	setWarningStatus?: (status: string) => void;
}

export const MemberMenuItem: FC<MemberMenuItemProps> = ({ label, onClick, isWarning = false, rightElement, setWarningStatus }) => {
	return (
		<Item
			onClick={onClick}
			className="flex truncate justify-between items-center w-full  font-sans text-sm font-medium text-theme-primary text-theme-primary-hover"
			onMouseEnter={() => {
				if (setWarningStatus) {
					if (isWarning) {
						setWarningStatus('#f67e882a');
					} else {
						setWarningStatus('var(--bg-item-hover)');
					}
				}
			}}
			onMouseLeave={() => {
				if (setWarningStatus) {
					setWarningStatus('var(--bg-item-hover)');
				}
			}}
		>
			<div
				className={`flex justify-between items-center w-full font-sans text-sm font-medium p-1 ${isWarning ? 'text-[#E13542]' : 'text-theme-primary-hover'}`}
			>
				<span
					className="truncate max-w-[160px] block overflow-hidden text-ellipsis whitespace-nowrap"
					title={label}
					data-e2e={generateE2eId('chat.channel_message.member_list.item.actions')}
				>
					{label}
				</span>
				{rightElement}
			</div>
		</Item>
	);
};
