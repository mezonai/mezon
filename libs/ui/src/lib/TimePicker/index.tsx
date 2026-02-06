import { Menu } from '@mezon/ui';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';

type TimePickerProps = {
	name: string;
	value: number;
	handleChangeTime: (e: any) => void;
};

function TimePicker(props: TimePickerProps) {
	const { name, value, handleChangeTime } = props;

	const currentTimeMs = useMemo(() => {
		if (typeof value !== 'number') return 0;
		const date = new Date(value);
		const hour = date.getHours();
		const minute = date.getMinutes();
		const roundedMinute = Math.round(minute / 15) * 15;
		return (hour * 60 + roundedMinute) * 60 * 1000;
	}, [value]);

	const formattedValue = useMemo(() => {
		if (typeof value !== 'number') return '';

		const date = new Date(value);

		const hour = date.getHours();
		const minute = date.getMinutes();

		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	}, [value]);

	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];
		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 15) {
				const ms = (hour * 60 + minute) * 60 * 1000;
				const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				const isSelected = ms === currentTimeMs;
				menuItems.push(
					<div
						className={`py-2 text-base bg-item-hover cursor-pointer ${isSelected ? 'bg-item-theme font-semibold' : ''}`}
						key={ms}
						data-time-value={ms}
						onClick={() => handleChangeTime(ms)}
					>
						{label}
					</div>
				);
			}
		}
		return <>{menuItems}</>;
	}, [value, currentTimeMs, handleChangeTime]);

	const handleVisibleChange = useCallback(
		(visible: boolean) => {
			if (visible) {
				setTimeout(() => {
					const selectedElement = document.querySelector(`[data-time-value="${currentTimeMs}"]`);
					if (selectedElement) {
						selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' });
					}
				}, 50);
			}
		},
		[currentTimeMs]
	);

	return (
		<Menu
			trigger="click"
			menu={menu}
			placement="bottomLeft"
			key={name}
			className="max-h-52 overflow-y-scroll text-theme-primary border-none ml-[3px] py-[6px] px-[8px] w-[200px] app-scroll"
			onVisibleChange={handleVisibleChange}
		>
			<div className="cursor-pointer block w-full bg-theme-input border-theme-primary rounded p-2 font-normal text-sm tracking-wide outline-none bg-option-theme ">
				{formattedValue}
			</div>
		</Menu>
	);
}

export default TimePicker;
