import { MezonIcon, MzIcons20 } from '@mezon/ui';
import React, { useRef } from 'react';

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	onClear?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search...', className = '', onClear }) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClear = () => {
		onChange('');
		onClear?.();
		inputRef.current?.focus();
	};

	return (
		<div className={`relative ${className}`}>
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<MezonIcon icon={MzIcons20.mzSearch} className="text-gray-400" />
			</div>

			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}]"
			/>

			{value && (
				<button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={handleClear}>
					<MezonIcon icon={MzIcons20.mzClose} className="text-gray-400 hover:text-gray-600" />
				</button>
			)}
		</div>
	);
};

export default SearchInput;
