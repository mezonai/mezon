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

export const renderDescriptionWithLinks = (text?: string) => {
	if (!text) return null;

	const urlRegex = /(https?:\/\/[^\s]+)/g;
	const parts = text.split(urlRegex);

	return parts.map((part, index) => {
		if (part.match(urlRegex)) {
			return (
				<a
					key={index}
					href={part}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-500 hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{part}
				</a>
			);
		}
		return part;
	});
};
