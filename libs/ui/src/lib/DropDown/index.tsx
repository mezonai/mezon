import { AlignType } from '@rc-component/trigger';
import RcDropdown from 'rc-dropdown';
// import 'rc-dropdown/assets/index.css';
import { createContext, JSXElementConstructor, ReactElement, ReactNode, useContext } from 'react';
import { Item } from './Dropdown.Content';
import './rc-dropdown.scss';

type MenuTriggerProps = {
	children: ReactNode;
	className?: string;
};
const Trigger = ({ children, className }: MenuTriggerProps) => {
	const { triggerRef, toggleOpen } = useDropdownMenuContext();
	return (
		<div ref={triggerRef} className={`flex-1 ${className}`} onClick={toggleOpen}>
			{children}
		</div>
	);
};
Trigger.displayName = 'MenuTrigger';

interface MenuProps {
	children: ReactElement<any, string | JSXElementConstructor<any>>;
	className?: string;
	placement?: 'bottom' | 'top' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
	holdOnClick?: boolean;
	menu?: ReactElement<any, string | JSXElementConstructor<any>> | (() => React.ReactElement);
	trigger?: 'click' | 'hover';
	onVisibleChange?: (visible: boolean) => void;
	visible?: boolean;
	align?: AlignType;
}

type DropdownMenuContextValue = {
	triggerRef: React.RefObject<HTMLDivElement>;
	open: boolean;
	toggleOpen: () => void;
	placement?: 'bottom' | 'top' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
	holdOnClickHandle: () => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

export function useDropdownMenuContext(): DropdownMenuContextValue {
	const context = useContext(DropdownMenuContext);
	if (!context) {
		throw new Error('useDropdownMenuContext must be used within a DropdownMenuProvider');
	}
	return context;
}

const Dropdown = ({ children, className, placement, holdOnClick = false, menu, trigger = 'click', onVisibleChange, visible, align }: MenuProps) => {
	return (
		<RcDropdown
			trigger={trigger}
			overlay={menu}
			placement={'bottomRight'}
			overlayClassName={`text-theme-message bg-[var(--theme-setting-nav)]  rounded-lg ${className}`}
			minOverlayWidthMatchTrigger
			autoDestroy={true}
			visible={visible}
			onVisibleChange={onVisibleChange}
			align={align}
		>
			{children}
		</RcDropdown>
	);
};

Dropdown.Item = Item;
Dropdown.Trigger = Trigger;
export default Dropdown;
