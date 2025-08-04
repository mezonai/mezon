import Select, { GroupBase, Props as SelectProps, StylesConfig } from 'react-select';

export interface SelectOption<T = unknown> {
	value: T;
	label: string;
}

export interface MezonSelectProps<IsMulti extends boolean = false, T = unknown> extends Omit<SelectProps<SelectOption<T>, IsMulti>, 'options'> {
	options: SelectOption<T>[];
	className?: string;
}

const ReactSelect = <IsMulti extends boolean = false, T = unknown>({
	options,
	className,
	styles: customStyles,
	...rest
}: MezonSelectProps<IsMulti, T>) => {
	const defaultStyles: StylesConfig<SelectOption<T>, IsMulti, GroupBase<SelectOption<T>>> = {
		control: (provided, state) => ({
			...provided,
			backgroundColor: 'var(--input-secondary)',
			borderColor: state.isFocused ? '#5865f2' : 'var(--border-theme-primary)',
			boxShadow: state.isFocused ? '0 0 0 1px #5865f2' : 'none',
			borderRadius: '6px',
			padding: '2px',
			minHeight: '38px',
			'&:hover': {
				borderColor: state.isFocused ? '#5865f2' : 'var(--border-theme-primary)'
			}
		}),
		menu: (provided) => ({
			...provided,
			backgroundColor: 'var(--bg-option-theme)',
			borderRadius: '6px',
			zIndex: 9999
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isFocused ? 'var(--bg-option-active)' : '',
			color: 'var(--text-secondary)',
			padding: '8px 12px',
			cursor: 'pointer'
		}),
		multiValue: (provided) => ({
			...provided,
			backgroundColor: 'var(--bg-tertiary)',
			borderRadius: '4px'
		}),
		multiValueLabel: (provided) => ({
			...provided,
			color: 'var(--text-secondary)',
			fontSize: '14px'
		}),
		multiValueRemove: (provided) => ({
			...provided,
			color: 'red',
			cursor: 'pointer',
			':hover': {
				backgroundColor: 'var(--bg-tertiary)',
				color: 'var(--text-secondary)'
			}
		}),
		input: (provided) => ({
			...provided,
			color: 'var(--text-secondary)',
			fontSize: '14px'
		}),
		singleValue: (provided) => ({
			...provided,
			color: 'var(--text-secondary)',
			fontSize: '14px'
		}),
		placeholder: (provided) => ({
			...provided,
			color: 'var(--text-theme-primary)',
			fontSize: '14px'
		}),
		indicatorSeparator: (provided) => ({
			...provided,
			backgroundColor: 'var(--border-theme-primary)'
		}),
		dropdownIndicator: (provided) => ({
			...provided,
			color: 'var(--text-theme-primary)',
			':hover': {
				color: 'var(--text-secondary)'
			}
		})
	};

	const finalStyles = customStyles || defaultStyles;

	return (
		<Select<SelectOption<T>, IsMulti>
			{...rest}
			options={options}
			styles={finalStyles}
			className={`react-select-container ${className || ''}`}
			classNamePrefix="react-select"
		/>
	);
};

export default ReactSelect;
