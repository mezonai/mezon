import { useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
	options?: { label: string; value: string }[];
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unused-vars
function CustomSelectField({ onChange, value, label, options = [], disabled, name, ...props }: CustomFormFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const selectedOption = useMemo(() => {
		return options.find((opt) => opt.value === value);
	}, [options, value]);

	const handleSelect = (optionValue: string) => {
		if (disabled) return;
		onChange(optionValue);
		setIsOpen(false);
	};

	return (
		<div className="CustomSelectField mt-2 relative" ref={containerRef}>
			{label && <label className="block text-sm mb-1">{label}</label>}

			<div
				onClick={() => !disabled && setIsOpen(!isOpen)}
				className={`
					flex items-center justify-between
					bg-transparent border rounded-sm px-2 py-2
					cursor-pointer select-none
					outline-none
					${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
					dark:border-gray-600 dark:text-white
					${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
				`}
			>
				<span className="truncate text-sm">{selectedOption ? selectedOption.label : <span className="text-gray-400">Select...</span>}</span>
				<svg
					className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</div>

			{isOpen && (
				<ul className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-sm shadow-lg max-h-60 overflow-auto">
					{options.map((option, index) => (
						<li
							key={index}
							onClick={() => handleSelect(option.value)}
							className={`
								px-3 py-2 cursor-pointer text-sm
								hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white
								${value === option.value ? 'bg-blue-50 dark:bg-blue-900/30 font-medium' : ''}
							`}
						>
							{option.label}
						</li>
					))}
					{options.length === 0 && <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">No options</li>}
				</ul>
			)}
		</div>
	);
}

export default connectField<CustomFormFieldProps>(CustomSelectField);
