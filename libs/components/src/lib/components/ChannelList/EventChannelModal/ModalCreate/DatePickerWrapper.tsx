import { format } from 'date-fns';
import { useRef } from 'react';

type DatePickerWrapperProps = {
	selected: Date | null;
	onChange: (date: Date) => void;
	dateFormat?: string;
	minDate?: Date;
	maxDate?: Date;
	className?: string;
	wrapperClassName?: string;
	placeholderText?: string;
	open?: boolean;
	onClickOutside?: () => void;
	onCalendarClose?: () => void;
	onCalendarOpen?: () => void;
	onFocus?: () => void;
};

const toInputValue = (date: Date): string => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
};

const DatePickerWrapper = ({
	selected,
	onChange,
	dateFormat,
	minDate,
	maxDate,
	className,
	wrapperClassName,
	placeholderText,
	onFocus
}: DatePickerWrapperProps) => {
	const dateInputRef = useRef<HTMLInputElement>(null);
	const min = minDate ? toInputValue(minDate) : undefined;
	const max = maxDate ? toInputValue(maxDate) : undefined;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (!value) return;
		if ((min && value < min) || (max && value > max)) return;
		onChange(new Date(`${value}T00:00:00`));
	};

	const dateInput = (
		<input
			ref={dateInputRef}
			type="date"
			className={dateFormat ? 'absolute inset-0 w-full h-full opacity-0 pointer-events-none' : className}
			value={selected ? toInputValue(selected) : ''}
			min={min}
			max={max}
			onChange={handleChange}
			onFocus={dateFormat ? undefined : onFocus}
			tabIndex={dateFormat ? -1 : undefined}
			aria-hidden={dateFormat ? true : undefined}
		/>
	);

	if (!dateFormat) {
		return <div className={wrapperClassName}>{dateInput}</div>;
	}

	const openPicker = () => {
		const input = dateInputRef.current;
		if (!input) return;
		try {
			input.showPicker();
		} catch {
			input.focus();
			input.click();
		}
	};

	return (
		<div className={`relative ${wrapperClassName ?? ''}`}>
			<input
				type="text"
				readOnly
				className={`${className ?? ''} cursor-pointer`}
				value={selected ? format(selected, dateFormat) : ''}
				placeholder={placeholderText ?? dateFormat}
				onClick={openPicker}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						openPicker();
					}
				}}
				onFocus={onFocus}
			/>
			{dateInput}
		</div>
	);
};

export default DatePickerWrapper;
