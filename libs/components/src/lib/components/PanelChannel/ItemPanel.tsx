import { Icons } from '@mezon/ui';
import { Checkbox, Radio } from 'flowbite-react';

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
			className={`flex flex-col justify-center w-full rounded-sm hover:[&>*]:text-[#fff] pr-2 ${danger ? 'hover:bg-colorDanger' : 'hover:bg-bgSelectItem'}`}
		>
			<div className={'flex flex-row items-center justify-between w-full'}>
				<li
					className={`text-[14px] font-medium w-full py-[6px] px-[8px] text-left cursor-pointer list-none textWhiteHoverImportant m-0 truncate
						${danger ? 'dark:text-colorDanger text-colorDanger' : info ? 'text-blue-500 dark:text-blue-400' : 'dark:text-[#B5BAC1] text-textSecondary800'}`}
				>
					{children}
				</li>
				{dropdown && <Icons.RightIcon defaultFill="#fff" />}
				{type === 'checkbox' && <Checkbox id="accept" checked={checked} defaultChecked={defaultChecked} readOnly />}
				{type === 'radio' && <Radio className="" name={name} value="change here" checked={checked} readOnly />}
			</div>
			{subText && <div className="text-[12px] text-[#B5BAC1] ml-[8px] -mt-2 mb-1">{subText}</div>}
		</button>
	);
};

export default ItemPanel;
