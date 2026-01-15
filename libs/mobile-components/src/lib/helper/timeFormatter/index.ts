export type LangCode = 'en' | 'vi';

export const timeFormat = (start: string, t: (key: string, options?: any) => string, lang: LangCode) => {
	const daysOfWeek = [
		t('common:dateTime.daysShort.sun'),
		t('common:dateTime.daysShort.mon'),
		t('common:dateTime.daysShort.tue'),
		t('common:dateTime.daysShort.wed'),
		t('common:dateTime.daysShort.thu'),
		t('common:dateTime.daysShort.fri'),
		t('common:dateTime.daysShort.sat')
	];

	const months = [
		t('common:dateTime.monthsShort.jan'),
		t('common:dateTime.monthsShort.feb'),
		t('common:dateTime.monthsShort.mar'),
		t('common:dateTime.monthsShort.apr'),
		t('common:dateTime.monthsShort.may'),
		t('common:dateTime.monthsShort.jun'),
		t('common:dateTime.monthsShort.jul'),
		t('common:dateTime.monthsShort.aug'),
		t('common:dateTime.monthsShort.sep'),
		t('common:dateTime.monthsShort.oct'),
		t('common:dateTime.monthsShort.nov'),
		t('common:dateTime.monthsShort.dec')
	];

	const date = new Date(start);
	const dayName = daysOfWeek[date.getUTCDay()];
	const monthName = months[date.getUTCMonth()];

	const day = date.getUTCDate();
	const hours = date.getUTCHours().toString().padStart(2, '0');
	const minutes = date.getUTCMinutes().toString().padStart(2, '0');

	if (lang === 'vi') {
		return `${dayName}, ${day} ${monthName} - ${hours}:${minutes}`;
	} else {
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
		return `${dayName} ${monthName} ${dayWithSuffix} - ${hours}:${minutes}`;
	}
};

export const handleTimeISO = (fullDateStr: Date, timeStr: string) => {
	const date = new Date(fullDateStr);

	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');

	const [hours, minutes] = timeStr.split(':').map(Number);
	const isoDate = new Date(Date.UTC(year, Number(month) - 1, Number(day), hours, minutes));

	return isoDate.toISOString();
};

export const getCurrentTimeRounded = (addMinute?: boolean) => {
	const now = new Date();
	if (addMinute) {
		now.setMinutes(now.getMinutes() + 30);
	}
	const minuteNow = now.getMinutes();
	const roundedMinutes = Math.floor(minuteNow / 30);
	if (roundedMinutes >= 1) {
		now.setHours(now.getHours() + 1);
		now.setMinutes(0);
	} else {
		now.setMinutes(30);
	}
	const hour = now.getHours();
	const minute = now.getMinutes();
	return `${hour}:${minute === 0 ? '00' : minute}`;
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

export const differenceTime = (end: string) => {
	const start = handleTimeISO(new Date(), getTimeFormatDay());

	const dateStart = new Date(start);
	const dateEnd = new Date(end);

	if (!isNaN(dateStart.getTime()) && !isNaN(dateEnd.getTime())) {
		const differenceInMilliseconds = dateEnd.getTime() - dateStart.getTime();

		const differenceInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

		return differenceInMinutes;
	}
	return -1;
};

export const getTimeFormatDay = () => {
	const date = new Date();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
};

export const isSameDay = (time: string) => {
	return compareDate(new Date(), time || '');
};

export function getNearTime(minutes: number): Date {
	const next = new Date(new Date().getTime() + minutes * 60000);
	return new Date(next.getFullYear(), next.getMonth(), next.getDate(), next.getHours());
}

export function getDayName(date: Date, lang: 'vi' | 'en') {
	return date.toLocaleDateString(lang, {
		weekday: 'long'
	});
}

export function getDayYearName(date: Date, lang: 'vi' | 'en'): string {
	return date.toLocaleDateString(lang, {
		month: 'short',
		day: '2-digit'
	});
}

export function getDayWeekName(date: Date, lang: 'vi' | 'en') {
	const day = getDayName(date, lang);
	const weekOfMonth = Math.ceil(date.getDate() / 7) - 1;

	const name_en = ['first', 'second', 'third', 'fourth', 'fifth'];
	const name_vi = ['đầu tiên', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm'];

	return lang === 'vi' ? `${day} ${name_vi[weekOfMonth]} của tháng` : `${name_en[weekOfMonth]} ${day}`;
}

export function convertTimestampToTimeAgo(timestampSeconds: number, t?: (key: string, options?: any) => string) {
	if (!timestampSeconds) return '';
	const now = Math.floor(Date.now() / 1000);
	const diff = now - timestampSeconds;

	const years = Math.floor(diff / (60 * 60 * 24 * 365));
	const months = Math.floor((diff % (60 * 60 * 24 * 365)) / (60 * 60 * 24 * 30));
	const days = Math.floor((diff % (60 * 60 * 24 * 30)) / (60 * 60 * 24));
	const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
	const minutes = Math.floor((diff % (60 * 60)) / 60);

	switch (true) {
		case years > 0:
			return `${years}y`;
		case months > 0:
			return `${months}mo`;
		case days > 0:
			return `${days}d`;
		case hours > 0:
			return `${hours}h`;
		case minutes > 0:
			return `${minutes}m`;
		default:
			return t ? t('common:justNow') : 'Just now';
	}
}
