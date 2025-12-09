import React, { useState } from 'react';

interface SearchInputProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	autoFocus?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ value = '', onChange, placeholder = 'Search...', className = '', autoFocus = false }) => {
	const [inputValue, setInputValue] = useState(value);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		onChange && onChange(e.target.value);
	};

	return (
		<div className={`flex items-center border rounded-lg px-3 py-2 bg-white ${className}`}>
			<svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				className="flex-1 outline-none bg-transparent text-gray-700"
				placeholder={placeholder}
				value={inputValue}
				onChange={handleChange}
				autoFocus={autoFocus}
			/>
		</div>
	);
};

export default SearchInput;
