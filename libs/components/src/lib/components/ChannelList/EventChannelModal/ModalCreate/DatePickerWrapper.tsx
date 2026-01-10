import { useEffect, useRef, useState } from 'react';

type DatePickerWrapperProps = {
	selected: Date;
	onChange: (date: Date) => void;
	dateFormat: string;
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

const DatePickerWrapper = (props: DatePickerWrapperProps) => {
	const [DatePickerComponent, setDatePickerComponent] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			// Check if click is outside the wrapper
			if (wrapperRef.current && !wrapperRef.current.contains(target)) {
				// Also check if click is not on the calendar popup (which might be in a portal)
				const calendarPopup = document.querySelector('.react-datepicker-popper');
				if (!calendarPopup || !calendarPopup.contains(target)) {
					setIsOpen(false);
				}
			}
		};

		if (isOpen) {
			// Use capture phase to get the event before stopPropagation
			document.addEventListener('mousedown', handleClickOutside, true);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside, true);
		};
	}, [isOpen]);

	const handleChange = (date: Date) => {
		props.onChange(date);
		setIsOpen(false);
	};

	if (isLoading || !DatePickerComponent) {
		return <div className="w-full h-[38px] bg-option-theme  animate-pulse rounded"></div>;
	}

	return (
		<div ref={wrapperRef}>
			<DatePickerComponent
				{...props}
				onChange={handleChange}
				open={isOpen}
				onInputClick={() => setIsOpen(true)}
				onClickOutside={() => setIsOpen(false)}
				popperClassName="z-[200]"
			/>
		</div>
	);
};

export default DatePickerWrapper;
