import { useEffect, useState } from 'react';

type DatePickerWrapperProps = {
	selected: Date;
	onChange: (date: Date) => void;
	dateFormat: string;
	minDate?: Date;
	className?: string;
	wrapperClassName?: string;
	open?: boolean;
	onClickOutside?: () => void;
	onCalendarClose?: () => void;
	onCalendarOpen?: () => void;
	onFocus?: () => void;
};

const DatePickerWrapper = (props: DatePickerWrapperProps) => {
	const [DatePickerComponent, setDatePickerComponent] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadDatePicker = async () => {
			try {
				const datepickerModule = await import('react-datepicker');
				require('react-datepicker/dist/react-datepicker.css');
				setDatePickerComponent(() => datepickerModule.default);
				setIsLoading(false);
			} catch (error) {
				console.error('Failed to load DatePicker:', error);
			}
		};

		loadDatePicker();
	}, []);

	if (isLoading || !DatePickerComponent) {
		return <div className="w-full h-[38px] bg-option-theme  animate-pulse rounded"></div>;
	}

	return <DatePickerComponent {...props} />;
};

export default DatePickerWrapper;
