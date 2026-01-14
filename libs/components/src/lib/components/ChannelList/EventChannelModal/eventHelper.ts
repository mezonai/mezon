import { isSameDay } from 'date-fns';

export const checkError = (startDate: number, endDate: number, setErrorStart: (value: boolean) => void, setErrorEnd: (value: boolean) => void) => {
	const currentDate = Date.now();
	const compareCurrentAndStart = currentDate < startDate;
	const compareStartAndEnd = startDate < endDate;
	const isStartDateSameCurrentDate = isSameDay(currentDate, startDate);
	const isStartDateSameEndDate = isSameDay(startDate, endDate);

	// check error startTime
	if (isStartDateSameCurrentDate) {
		setErrorStart(!compareCurrentAndStart);
	} else {
		setErrorStart(false);
	}
	// check error startEnd
	if (!compareStartAndEnd && isStartDateSameEndDate) {
		setErrorEnd(!compareStartAndEnd);
	} else {
		setErrorEnd(false);
	}
};
