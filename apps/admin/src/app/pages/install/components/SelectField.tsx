import { Icons, Menu } from '@mezon/ui';
import { useCallback, useMemo, useState } from 'react';

export type SelectFieldConfig<T> = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	options?: any[];
	className?: string;
	uppercase?: boolean;
};

const SelectField = <T,>({ label, options, value, onChange, errorMessage, className, uppercase }: SelectFieldConfig<T>) => {
	const [visible, setVisible] = useState(false);
	const uppercaseClass = uppercase ? 'uppercase' : '';
	const selectedOption = useMemo(() => {
		return options?.find((option) => option.value === value)?.label || '-- Select --';
	}, [options, value]);

	const handleOptionClick = useCallback(
		(optionValue: string) => {
			onChange(optionValue);
			setVisible(false);
		},
		[onChange]
	);

	const handleVisibleChange = useCallback((isVisible: boolean) => {
		setVisible(isVisible);
	}, []);

	const menu = useMemo(
		() => (
			<div
				className={`border dark:border-white/[0.08] border-slate-200/80 py-1.5 px-2 max-h-[200px] overflow-y-auto thread-scroll z-30 bg-white/95 dark:bg-[#151726]/95 backdrop-blur-xl rounded-xl shadow-xl min-w-[180px]`}
			>
				{options?.map((option, index) => (
					<Menu.Item
						key={index}
						onClick={() => handleOptionClick(option.value)}
						className={`truncate px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-all duration-200 text-xs font-semibold ${uppercaseClass} ${
							value === option.value
								? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold'
								: 'text-slate-700 dark:text-slate-300'
						}`}
					>
						{option.label}
					</Menu.Item>
				))}
			</div>
		),
		[options, value, handleOptionClick, className, uppercaseClass]
	);

	return (
		<div className="flex flex-col gap-1 p-0 bg-transparent w-full">
			<label className="block text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
				{label}
			</label>

			<Menu
				trigger="click"
				menu={menu}
				placement="bottomLeft"
				visible={visible}
				onVisibleChange={handleVisibleChange}
				className="border-none p-0 z-20 rounded-lg"
			>
				<div className="w-full h-9 rounded-lg flex flex-row px-3.5 justify-between items-center cursor-pointer bg-slate-50 dark:bg-[#171a2a] text-slate-900 dark:text-slate-100 border dark:border-white/[0.04] border-slate-200 transition-all duration-300 hover:border-violet-500/40 dark:hover:border-violet-500/30 focus-within:ring-2 focus-within:ring-violet-500/20 shadow-sm">
					<p className={`text-xs font-semibold truncate ${uppercaseClass}`}>{selectedOption}</p>
					<div className="text-slate-400 dark:text-slate-500 shrink-0 ml-2">
						<Icons.ArrowDownFill className={`size-3.5 transform transition-transform duration-200 ${visible ? 'rotate-180' : ''}`} />
					</div>
				</div>
			</Menu>

			{errorMessage && (
				<span className="text-red-500 text-[10px] font-medium text-left mt-0.5 pl-1 flex items-center gap-1 animate-fade-in">
					{errorMessage}
				</span>
			)}
		</div>
	);
};

export default SelectField;
