import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Item } from 'react-contexify';
import { useTranslation } from 'react-i18next';

export interface CommandOption {
	value: string;
	label: string;
	command: {
		id: string;
		display: string;
		description?: string;
		isBuiltIn?: boolean;
		menu_type?: number;
	};
}

interface SearchableCommandListProps {
	options: CommandOption[];
	onChange: (selectedOption: CommandOption | null) => void;
	placeholder?: string;
	isLoading?: boolean;
	className?: string;
	autoFocus?: boolean;
	filterOption?: (option: CommandOption, inputValue: string) => boolean;
	formatOptionLabel?: (option: CommandOption) => React.ReactNode;
}

const contextSubmenuActiveStyle = {
	'--contexify-activeItem-color': '#fff',
	'--contexify-activeItem-bgColor': '#3498db',
	'--contexify-activeItem-radius': '8px',
	'--contexify-item-color': 'var(--text-theme-primary)',
	'--contexify-itemContent-padding': '0'
} as React.CSSProperties;

const optionContentClassName =
	"flex items-center gap-2 w-full font-['gg_sans','Noto_Sans',sans-serif] text-sm font-medium text-theme-primary p-2 border border-theme-primary rounded transition-colors hover:bg-[#3498db] hover:text-white";

export const SearchableCommandList: React.FC<SearchableCommandListProps> = ({
	options,
	onChange,
	placeholder,
	isLoading = false,
	className = '',
	autoFocus = false,
	filterOption,
	formatOptionLabel
}) => {
	const { t } = useTranslation('contextMenu');
	const [searchValue, setSearchValue] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const filteredOptions = useMemo(() => {
		if (!searchValue.trim()) {
			return options;
		}

		return options.filter((option) => {
			if (filterOption) {
				return filterOption(option, searchValue);
			}
			return (
				option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
				option.command.display.toLowerCase().includes(searchValue.toLowerCase()) ||
				(option.command.description && option.command.description.toLowerCase().includes(searchValue.toLowerCase()))
			);
		});
	}, [options, searchValue, filterOption]);

	useEffect(() => {
		if (autoFocus && inputRef.current) {
			inputRef.current.focus();
		}
	}, [autoFocus]);

	const handleOptionClick = useCallback(
		(option: CommandOption) => {
			onChange(option);
		},
		[onChange]
	);

	const defaultFormatOptionLabel = useCallback(
		(option: CommandOption) => (
			<>
				{option.command?.menu_type === 2 && <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded font-medium">BOT</span>}
				<span className="font-medium text-sm">{option.command?.display}</span>
			</>
		),
		[]
	);

	return (
		<div style={contextSubmenuActiveStyle} className={`bg-theme-contexify border border-theme-primary rounded-md shadow-lg ${className}`}>
			<div className="p-2 border-b border-theme-primary">
				<input
					onClick={(e) => e.stopPropagation()}
					ref={inputRef}
					type="text"
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					placeholder={placeholder || t('typeToSearch')}
					className="w-full px-2 py-1.5 bg-theme-input text-theme-primary placeholder-theme-secondary border-none rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
					disabled={isLoading}
				/>
			</div>

			<div ref={listRef} className="h-60 overflow-y-auto p-2 thread-scroll space-y-1" role="listbox">
				{isLoading ? (
					<div className="p-4 text-center text-theme-secondary">
						<div className="flex items-center justify-center gap-2">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
								<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="30" strokeDashoffset="30" />
							</svg>
							<span className="text-sm">{t('loadingCommands')}</span>
						</div>
					</div>
				) : filteredOptions.length === 0 ? (
					<div className="p-4 text-center text-theme-secondary">
						<span className="text-sm">{t('noCommandsFound')}</span>
					</div>
				) : (
					filteredOptions.map((option) => (
						<Item key={option.value} className="w-full px-2 py-1" onClick={() => handleOptionClick(option)}>
							<div className={optionContentClassName}>
								{formatOptionLabel ? formatOptionLabel(option) : defaultFormatOptionLabel(option)}
							</div>
						</Item>
					))
				)}
			</div>
		</div>
	);
};
