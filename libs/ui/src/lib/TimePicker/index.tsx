import { Menu } from '@mezon/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type TimePickerProps = {
	name: string;
	value: number;
	handleChangeTime: (e: any) => void;
};

function TimePicker(props: TimePickerProps) {
	const { name, value, handleChangeTime } = props;
	const formattedValue = useMemo(() => {
		if (typeof value !== 'number') return '';

		const date = new Date(value);

		const hour = date.getHours(); // local hour
		const minute = date.getMinutes(); // local minute

		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	}, [value]);
	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];
		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 15) {
				const ms = (hour * 60 + minute) * 60 * 1000;
				const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				menuItems.push(
					<div className="py-2 text-base bg-item-hover cursor-pointer" key={ms} onClick={() => handleChangeTime(ms)}>
						{label}
					</div>
				);
			}
		}
		return <>{menuItems}</>;
	}, [value]);

	return (
		<Menu
			trigger="click"
			menu={menu}
			placement="bottomLeft"
			key={name}
			className="max-h-52 overflow-y-scroll text-theme-primary border-none ml-[3px] py-[6px] px-[8px] w-[200px] app-scroll"
		>
			<div className="cursor-pointer block w-full bg-theme-input border-theme-primary rounded p-2 font-normal text-sm tracking-wide outline-none bg-option-theme ">
				{formattedValue}
			</div>
		</Menu>
	);
}

export default TimePicker;
