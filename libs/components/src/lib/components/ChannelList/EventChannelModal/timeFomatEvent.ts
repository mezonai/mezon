export const timeFomat = (start: string | number, locale?: string) => {
	const date = new Date(start);
	const timezoneOffsetMinutes = -date.getTimezoneOffset();
	date.setUTCMinutes(date.getUTCMinutes() + timezoneOffsetMinutes);

	const currentLocale = locale || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en');

	const localeMap: Record<string, string> = {
		vi: 'vi-VN',
		en: 'en-US'
	};

	const browserLocale = localeMap[currentLocale] || 'en-US';

	try {
		const dateFormatter = new Intl.DateTimeFormat(browserLocale, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		});

		const timeFormatter = new Intl.DateTimeFormat(browserLocale, {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: 'UTC'
		});

		const datePart = dateFormatter.format(date);
		const timePart = timeFormatter.format(date);

		return `${datePart} - ${timePart}`;
	} catch (error) {
		const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayName = daysOfWeek[date.getUTCDay()];
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const monthName = months[date.getUTCMonth()];
		const day = date.getUTCDate();
		const suffix = (day: number) => {
			if (day > 3 && day < 21) return 'th';
			switch (day % 10) {
				case 1:
					return 'st';
				case 2:
					return 'nd';
				case 3:
					return 'rd';
				default:
					return 'th';
			}
		};
		const dayWithSuffix = `${day}${suffix(day)}`;
		const hours = date.getUTCHours().toString().padStart(2, '0');
		const minutes = date.getUTCMinutes().toString().padStart(2, '0');
		return `${dayName} ${monthName} ${dayWithSuffix} - ${hours}:${minutes}`;
	}
};

export function convertToLongUTCFormat(dateString: string): string {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		throw new Error('Invalid date string format');
	}
	let isoString = date.toISOString();
	if (isoString.endsWith('Z') && !isoString.endsWith('.000Z')) {
		isoString = `${isoString.slice(0, -1)}.000Z`;
	}

	return isoString;
}

export const createI18nTimeFormatter = (currentLanguage: string) => {
	return (start: string) => timeFomat(start, currentLanguage);
};

export const formatEventTime = (
	start: string,
	options: {
		locale?: string;
		includeYear?: boolean;
		timeZone?: string;
		format?: 'short' | 'long';
	} = {}
) => {
	const { locale, includeYear = false, timeZone = 'UTC', format = 'short' } = options;

	const date = new Date(start);
	const currentLocale = locale || (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en');

	const localeMap: Record<string, string> = {
		vi: 'vi-VN',
		en: 'en-US'
	};

	const browserLocale = localeMap[currentLocale] || 'en-US';

	try {
		const dateOptions: Intl.DateTimeFormatOptions = {
			weekday: format === 'short' ? 'short' : 'long',
			month: format === 'short' ? 'short' : 'long',
			day: 'numeric',
			...(includeYear && { year: 'numeric' }),
			timeZone
		};

		const timeOptions: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone
		};

		const dateFormatter = new Intl.DateTimeFormat(browserLocale, dateOptions);
		const timeFormatter = new Intl.DateTimeFormat(browserLocale, timeOptions);

		const datePart = dateFormatter.format(date);
		const timePart = timeFormatter.format(date);

		return `${datePart} - ${timePart}`;
	} catch (error) {
		return timeFomat(start, currentLocale);
	}
};

export const getCurrentTimeRounded = (addMinute?: boolean) => {
	const now = new Date();
	const minuteNow = now.getMinutes();
	if (minuteNow < 30) {
		now.setHours(now.getHours() + 1);
	} else {
		now.setHours(now.getHours() + 2);
	}
	now.setMinutes(0);
	if (addMinute) {
		now.setHours(now.getHours() + 1);
	}

	const hour = now.getHours();
	return `${hour}:00`;
};

export const getNearestFutureWholeHourTimestamp = (from: number = Date.now()) => {
	const d = new Date(from);
	const hasFractionalHour = d.getMinutes() !== 0 || d.getSeconds() !== 0 || d.getMilliseconds() !== 0;
	if (hasFractionalHour) {
		d.setHours(d.getHours() + 1);
	}
	d.setMinutes(0, 0, 0);
	return d.getTime();
};

export const getDefaultCreateEventTimes = (from: number = Date.now()) => {
	const startTs = getNearestFutureWholeHourTimestamp(from);
	const endTs = startTs + 60 * 60 * 1000;

	const startDateMidnight = getTimeTodayMidNight(startTs);
	const endDateMidnight = getTimeTodayMidNight(endTs);

	return {
		selectedDateStart: startDateMidnight,
		timeStart: startTs - startDateMidnight,
		selectedDateEnd: endDateMidnight,
		timeEnd: endTs - endDateMidnight
	};
};

export const compareDate = (start: Date | string, end: Date | string) => {
	const startDay = new Date(start);
	const endDay = new Date(end);

	const dayStart = startDay.getDate();
	const monthStart = startDay.getMonth();
	const yearStart = startDay.getFullYear();

	const dayEnd = endDay.getDate();
	const monthEnd = endDay.getMonth();
	const yearEnd = endDay.getFullYear();

	if (yearStart === yearEnd && monthStart === monthEnd && dayStart === dayEnd) {
		return true;
	} else {
		return false;
	}
};

export const compareTime = (start: string, end: string, equal?: boolean) => {
	const [hourStart, minuteStart] = start.split(':').map(Number);
	const [hourEnd, minuteEnd] = end.split(':').map(Number);

	const totalStart = hourStart * 60 + minuteStart;
	const totalEnd = hourEnd * 60 + minuteEnd;

	if (equal && totalStart <= totalEnd) {
		return true;
	}

	if (totalStart < totalEnd) {
		return true;
	}
	return false;
};

export const getTimeFomatDay = () => {
	const date = new Date();
	const timezoneOffsetMinutes = -date.getTimezoneOffset();
	date.setUTCMinutes(date.getUTCMinutes() + timezoneOffsetMinutes);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
};

export const formatTimeStringToHourFormat = (timeString: string | number) => {
	const date = new Date(Number(timeString) * 1000);

	const hours = date.getHours();
	const minutes = date.getMinutes();

	return hours * 60 * 60 * 1000 + minutes * 60 * 1000;
};

export const getTimeTodayMidNight = (time?: number) => {
	const timeInMs = time && time < 10000000000 ? time * 1000 : time;
	if (timeInMs) return new Date(new Date(timeInMs).setHours(0, 0, 0, 0)).getTime();
	return new Date(new Date().setHours(0, 0, 0, 0)).getTime();
};

export const formatToLocalDateString = (timeString: string | Date) => {
	let date: Date;

	if (timeString instanceof Date) {
		if (isNaN(timeString.getTime())) {
			throw new Error(`Invalid Date object: Unable to parse ${timeString}`);
		}
		date = new Date(timeString);
	} else if (typeof timeString === 'string') {
		if (timeString.includes('T') && timeString.endsWith('Z')) {
			date = new Date(timeString);
		} else {
			date = new Date(timeString);
		}
		if (isNaN(date.getTime())) {
			throw new Error(`Invalid timeString: Unable to parse ${timeString}`);
		}
	} else {
		throw new Error(`Invalid input: timeString must be a string or Date object`);
	}
	const timezoneOffsetMinutes = -date.getTimezoneOffset();
	date.setUTCMinutes(date.getUTCMinutes() + timezoneOffsetMinutes);
	return date.toISOString().slice(0, -1);
};
