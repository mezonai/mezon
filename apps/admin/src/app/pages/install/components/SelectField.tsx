import { Icons, Menu } from '@mezon/ui';
import { useCallback, useMemo } from 'react';

export type SelectFieldConfig<T> = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	options?: any[];
	className?: string;
};

const SelectField = <T,>({ label, options, value, onChange, errorMessage, className }: SelectFieldConfig<T>) => {
	const selectedOption = useMemo(() => {
		return options?.find((option) => option.value === value)?.label || '-- Select --';
	}, [options, value]);

	const handleOptionClick = useCallback(
		(optionValue: string) => {
			onChange(optionValue);
		},
		[onChange]
	);

	const menu = useMemo(
		() => (
			<div className="border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll thread-scroll z-20 bg-white dark:bg-[#2b2d31]  rounded-lg shadow-lg">
				{options?.map((option, index) => (
					<Menu.Item
						key={index}
						onClick={() => handleOptionClick(option.value)}
						className={`truncate px-3 py-2 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#3f4147] cursor-pointer transition-colors duration-150 ${className} ${
							value === option.value
								? 'bg-[#e5e7eb] dark:bg-[#313338] text-[#1f2937] dark:text-white font-medium'
								: 'text-[#374151] dark:text-[#d1d5db]'
						}`}
					>
						{option.label}
					</Menu.Item>
				))}
			</div>
		),
		[options, value, handleOptionClick]
	);

	return (
		<div className="flex flex-col gap-2 p-4 bg-[#f9fafb] dark:bg-[#1e1f22]">
			<label className="block text-left text-sm font-medium mb-1 text-[#111827] dark:text-[#d1d5db]">{label}</label>

			<Menu
				trigger="click"
				menu={menu}
				placement="bottomLeft"
				className="border-none py-[6px] px-[8px]   z-20 bg-white dark:bg-[#2b2d31]  rounded-lg shadow-lg"
			>
				<div className="w-full h-[40px] rounded-md flex flex-row px-3 justify-between items-center cursor-pointer bg-white text-[#111827] border border-[#4b5563] dark:bg-[#2d2f33] dark:text-[#d1d5db]">
					<p className="truncate">{selectedOption}</p>
					<Icons.ArrowDownFill />
				</div>
			</Menu>

			{errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
		</div>
	);
};

export default SelectField;
