import { isValid } from 'date-fns';

type DatePickerWrapperProps = {
	selected: Date | null;
	onChange: (date: Date) => void;
	onClear?: () => void;
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

const toInputValue = (date?: Date | null): string => {
	if (!date || !isValid(date)) return '';
	const y = String(date.getFullYear()).padStart(4, '0');
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
};

const DatePickerWrapper = ({ selected, onChange, onClear, minDate, maxDate, className, wrapperClassName, onFocus }: DatePickerWrapperProps) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (!value) {
			onClear?.();
			return;
		}
		const date = new Date(`${value}T00:00:00`);
		if (isValid(date)) {
			onChange(date);
		}
	};

	return (
		<div className={wrapperClassName}>
			<input
				type="date"
				className={className}
				value={toInputValue(selected)}
				min={toInputValue(minDate) || undefined}
				max={toInputValue(maxDate) || undefined}
				onChange={handleChange}
				onFocus={onFocus}
			/>
		</div>
	);
};

export default DatePickerWrapper;
