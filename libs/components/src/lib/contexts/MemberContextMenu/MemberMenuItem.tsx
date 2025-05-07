import { FC, ReactNode } from 'react';
import { Item } from 'react-contexify';

interface MemberMenuItemProps {
	label: string;
	onClick: () => void;
	isWarning?: boolean;
	rightElement?: ReactNode;
}

export const MemberMenuItem: FC<MemberMenuItemProps> = ({ label, onClick, isWarning = false, rightElement }) => {
	return (
		<Item
			onClick={onClick}
			className="flex truncate justify-between items-center w-full font-sans text-sm font-medium dark:text-[#ADB3B9] text-[#4E5058] hover:text-[#FFFFFF] dark:hover:text-[#FFFFFF] p-1"
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					width: '100%',
					fontFamily: `'gg sans', 'Noto Sans', sans-serif`,
					fontSize: '14px',
					fontWeight: 500
				}}
				className={`${isWarning ? 'text-[#E13542] hover:text-[#FFFFFF]' : 'dark:text-[#ADB3B9] text-[#4E5058] hover:text-[#FFFFFF] dark:hover:text-[#FFFFFF]'} p-1`}
			>
				<span>{label}</span>
				{rightElement}
			</div>
		</Item>
	);
};
