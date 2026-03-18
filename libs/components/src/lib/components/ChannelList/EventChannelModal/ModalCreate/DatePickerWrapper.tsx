type DatePickerWrapperProps = {
	selected: Date;
	onChange: (date: Date) => void;
	dateFormat?: string;
	minDate?: Date;
	maxDate?: Date;
	className?: string;
	wrapperClassName?: string;
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

const DatePickerWrapper = ({ selected, onChange, minDate, maxDate, className, wrapperClassName, onFocus }: DatePickerWrapperProps) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.value) return;
		onChange(new Date(`${e.target.value}T00:00:00`));
	};

	return (
		<div className={wrapperClassName}>
			<input
				type="date"
				className={className}
				value={toInputValue(selected)}
				min={minDate ? toInputValue(minDate) : undefined}
				max={maxDate ? toInputValue(maxDate) : undefined}
				onChange={handleChange}
				onFocus={onFocus}
			/>
		</div>
	);
};

export default DatePickerWrapper;
