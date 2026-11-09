import { MezonIcon, MzIcons20 } from '@mezon/ui';
import React, { useEffect, useRef, useState } from 'react';

interface Option {
	value: string;
	label: string;
}

interface SelectDropdownProps {
	options: Option[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({ options, value, onChange, placeholder = 'Select an option', className = '' }) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const selectedOption = options.find((option) => option.value === value);

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			<button
				type="button"
				className="w-full flex items-center justify-between px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}]"
				onClick={() => setIsOpen(!isOpen)}
			>
				<span className="block truncate">{selectedOption ? selectedOption.label : placeholder}</span>
				<MezonIcon icon={MzIcons20.mzChevronDown} className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
			</button>

			{isOpen && (
				<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
					<ul className="py-1 max-h-60 overflow-auto">
						{options.map((option) => (
							<li
								key={option.value}
								className="px-4 py-2 cursor-pointer hover:bg-gray-100"
								onClick={() => {
									onChange(option.value);
									setIsOpen(false);
								}}
							>
								{option.label}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default SelectDropdown;
