import { selectTheme } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

type TimePickerProps = {
	name: string;
	value: string;
	handleChangeTime: (e: any) => void;
};

function TimePicker(props: TimePickerProps) {
	const appearanceTheme = useSelector(selectTheme);
	const { name, value, handleChangeTime } = props;
	// if value is H:MM => HH:MM
	const formattedValue = useMemo(() => {
		const [hour, minute] = value.split(':');
		const normalizedHour = hour.padStart(2, '0');
		const normalizedMinute = minute.padStart(2, '0');
		return `${normalizedHour}:${normalizedMinute}`;
	}, [value]);
	const renderOptions = useMemo(() => {
		const options = [];
		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 15) {
				const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				options.push(
					<option key={timeString} value={timeString}>
						{timeString}
					</option>
				);
			}
		}
		return options;
	}, []);

	return (
		<select
			name={name}
			onChange={handleChangeTime}
			className={`block w-full bg-theme-input border-theme-primary rounded p-2 font-normal text-sm tracking-wide outline-none bg-option-theme  ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}


			value={formattedValue}
		>
			{renderOptions}
		</select>
	);
}

export default TimePicker;
