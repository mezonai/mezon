import { useEffect, useRef, useState } from 'react';

type Option = {
	value: string;
	label: string;
};

type Props = {
	value: string;
	onChange: (v: string) => void;
	options: Option[];
	className?: string;
	id?: string;
	name?: string;
};

export default function SelectControl({ value, onChange, options, className, id, name }: Props) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((o) => o.value === value);
	const displayText = selectedOption?.label;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSelect = (optionValue: string) => {
		onChange(optionValue);
		setOpen(false);
	};

	return (
		<div ref={containerRef} className="relative w-full">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={`w-full h-[40px] rounded-md dark:bg-[#1e1f22] bg-bgLightModeThird flex flex-row px-3 justify-between items-center ${className || ''}`}
			>
				<p className="truncate max-w-[90%] text-left">{displayText}</p>
				<svg
					width="16"
					height="16"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
				>
					<path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			{open && (
				<ul className="absolute z-20 mt-1 w-full left-0 dark:bg-[#2b2d31] bg-white border-none py-[6px] px-[8px] rounded-lg shadow-lg max-h-60 overflow-y-auto">
					{options.map((option) => (
						<li
							key={option.value}
							onClick={() => handleSelect(option.value)}
							className="cursor-pointer select-none px-3 py-2 rounded-md hover:bg-[#f3f4f6] dark:hover:bg-[#3f4147] transition-colors duration-150"
						>
							{option.label}
						</li>
					))}
				</ul>
			)}

			<input type="hidden" id={id} name={name} value={value} />
		</div>
	);
}
