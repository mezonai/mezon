import { Icons } from '@mezon/ui';

type ItemPanelProps = {
	children: string;
	dropdown?: string;
	danger?: boolean;
	type?: 'radio' | 'checkbox' | 'none';
	onClick?: () => void;
	notificationId?: number;
	defaultNotifi?: boolean;
	defaultChecked?: boolean;
	checked?: boolean;
	name?: string;
	subText?: string;
	disabled?: boolean;
	info?: boolean;
};

const ItemPanel = ({
	children,
	dropdown,
	type,
	danger,
	onClick,
	notificationId,
	defaultNotifi,
	defaultChecked,
	checked,
	name,
	subText,
	disabled,
	info
}: ItemPanelProps) => {
	return (
		<button
			disabled={disabled}
			onClick={onClick}
			className={`flex flex-col justify-center w-full rounded-sm bg-item-hover pr-2 ${danger ? 'hover:bg-[#f67e882a]' : ''}`}
		>
			<div className={'flex flex-row items-center justify-between w-full'}>
				<li
					className={`text-[14px] font-medium w-full py-[6px] px-[8px]  text-left cursor-pointer list-none m-0 truncate
						${danger ? ' text-colorDanger ' : info ? 'text-blue-500 dark:text-blue-400' : 'text-theme-primary text-theme-primary-hover'}`}
				>
					{children}
				</li>
				{dropdown && <Icons.RightIcon defaultFill="#fff" />}
				{type === 'checkbox' && <input type="checkbox" id="accept" checked={checked} defaultChecked={defaultChecked} readOnly />}
				{type === 'radio' && <input type="radio" className="" name={name} value="change here" checked={checked} readOnly />}
			</div>
			{subText && <div className="text-[12px] ml-[8px] -mt-2 mb-1 text-theme-primary">{subText}</div>}
		</button>
	);
};

export default ItemPanel;
