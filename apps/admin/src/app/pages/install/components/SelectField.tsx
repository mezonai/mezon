import { Icons } from '@mezon/ui';
import { Dropdown } from 'flowbite-react';

export type SelectFieldConfig<T> = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	options?: any[];
};

const SelectField = <T,>({ label, options, value, onChange, errorMessage }: SelectFieldConfig<T>) => {
	const selectedOption = options?.find((option) => option.value === value)?.label || '-- Select --';

	return (
		<div className="flex flex-col gap-2 p-4 bg-[#f9fafb] dark:bg-[#1e1f22]">
			<label className="block text-left text-sm font-medium mb-1 text-[#111827] dark:text-[#d1d5db]">{label}</label>

			<Dropdown
				trigger="click"
				renderTrigger={() => (
					<div className="w-full h-[40px] rounded-md flex flex-row px-3 justify-between items-center cursor-pointer bg-white text-[#111827] border border-[#4b5563] dark:bg-[#2d2f33] dark:text-[#d1d5db]">
						<p className="truncate">{selectedOption}</p>
						<Icons.ArrowDownFill />
					</div>
				)}
				label=""
				placement="bottom-end"
				className="border-none py-[6px] px-[8px] max-h-[200px] overflow-y-scroll z-20 bg-white customSmallScrollLightMode dark:bg-black dark:thread-scroll"
			>
				{options?.map((option, index) => (
					<Dropdown.Item
						key={index}
						onClick={() => onChange(option.value)}
						className={`truncate ${value === option.value ? 'bg-[#f2f3f5] dark:bg-[#313338]' : ''}`}
					>
						{option.label}
					</Dropdown.Item>
				))}
			</Dropdown>

			{errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
		</div>
	);
};

export default SelectField;
