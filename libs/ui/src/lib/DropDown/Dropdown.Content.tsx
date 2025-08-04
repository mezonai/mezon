import { ReactNode } from 'react';
import { useDropdownMenuContext } from '.';

type MenuItemProps = {
	children: ReactNode;
	onClick: () => void;
	className?: string;
};
const Item = ({ children, onClick, className }: MenuItemProps) => {
	return (
		<div className={`rounded-lg p-2 ${className}`} onClick={onClick}>
			{children}
		</div>
	);
};
Item.displayName = 'MenuItem';
type MenuContentProps = {
	children: ReactNode;
	className?: string;
};
const Content = ({ children, className }: MenuContentProps) => {
	const { open, position, holdOnClickHandle } = useDropdownMenuContext();
	if (!open) return;
	return (
		<div style={position} className={`absolute rounded-lg p-2 w-full ${className}`}>
			<div className={`flex flex-col flex-1`} onClick={holdOnClickHandle}>
				{children}
			</div>
		</div>
	);
};

export { Content, Item };
