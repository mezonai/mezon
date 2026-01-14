import { selectTheme } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

type TimePickerProps = {
	name: string;
	value: number;
	handleChangeTime: (e: any) => void;
};

function TimePicker(props: TimePickerProps) {
	const appearanceTheme = useSelector(selectTheme);
	const { name, value, handleChangeTime } = props;
	const formattedValue = useMemo(() => {
		if (typeof value !== 'number') return '';

		const date = new Date(value);

		const hour = date.getHours(); // local hour
		const minute = date.getMinutes(); // local minute

		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	}, [value]);
	const renderOptions = useMemo(() => {
		const options = [];
		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 15) {
				const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				const timeValue = (hour * 60 * 60 + minute * 60) * 1000;
				options.push(
					<option key={timeString} value={timeValue}>
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
			className={` cursor-pointer block w-full bg-theme-input border-theme-primary rounded p-2 font-normal text-sm tracking-wide outline-none bg-option-theme  ${appearanceTheme === 'light' ? 'customScrollLightMode' : 'app-scroll'}`}
			value={formattedValue}
		>
			{renderOptions}
		</select>
	);
}

export default TimePicker;
