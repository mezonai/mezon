import type { Locale } from 'date-fns';
import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
	vi,
	en: enUS,
	'en-US': enUS,
	'vi-VN': vi
};

export const getDateLocale = (languageCode: string): Locale => {
	return localeMap[languageCode] || localeMap[languageCode.split('-')[0]] || enUS;
};

export const formatGalleryDate = (date: Date, languageCode: string): string => {
	const locale = getDateLocale(languageCode);
	return format(date, 'MMMM d', { locale });
};

export const formatDateI18n = (date: Date, languageCode: string, formatString = 'MMM dd, yyyy'): string => {
	const locale = getDateLocale(languageCode);
	return format(date, formatString, { locale });
};

export const formatRelativeTime = (date: Date, languageCode: string): string => {
	const locale = getDateLocale(languageCode);

	const now = new Date();
	const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

	if (diffInHours < 24) {
		return format(date, 'HH:mm', { locale });
	} else if (diffInHours < 24 * 7) {
		return format(date, 'EEEE', { locale });
	} else {
		return format(date, 'MMM d', { locale });
	}
};

export const formatDateRange = (startDate: Date, endDate: Date, languageCode: string): string => {
	const locale = getDateLocale(languageCode);

	const startFormatted = format(startDate, 'MMM d', { locale });
	const endFormatted = format(endDate, 'MMM d', { locale });

	if (startDate.getFullYear() === endDate.getFullYear()) {
		return `${startFormatted} - ${endFormatted}`;
	} else {
		const startWithYear = format(startDate, 'MMM d, yyyy', { locale });
		const endWithYear = format(endDate, 'MMM d, yyyy', { locale });
		return `${startWithYear} - ${endWithYear}`;
	}
};

export const convertTimeStringI18n = (dateString: number, t: (key: string) => string, languageCode = 'en') => {
	if (!dateString || typeof dateString !== 'number') {
		return '';
	}

	const codeTime = new Date(dateString * 1000);
	const today = startOfDay(new Date());
	const yesterday = startOfDay(subDays(new Date(), 1));
	const locale = getDateLocale(languageCode);

	if (isSameDay(codeTime, today)) {
		return format(codeTime, 'HH:mm', { locale });
	} else if (isSameDay(codeTime, yesterday)) {
		const formattedTime = format(codeTime, 'HH:mm', { locale });
		return `${t('yesterdayAt')} ${formattedTime}`;
	} else {
		const formattedDate = format(codeTime, 'dd/MM/yyyy, HH:mm', { locale });
		return formattedDate;
	}
};

export const convertDateStringI18n = (dateString: number, t: (key: string) => string, languageCode = 'en', options?: { dateOnly?: boolean }) => {
	if (!dateString || typeof dateString !== 'number') {
		return '';
	}
	const codeTime = new Date(dateString);
	const currentDate = new Date();
	const locale = getDateLocale(languageCode);

	if (options?.dateOnly) {
		const formattedDate = format(codeTime, 'dd MMMM yyyy', { locale });
		return formattedDate;
	}

	if (isSameDay(codeTime, currentDate)) {
		const formattedDate = format(codeTime, 'dd MMMM yyyy', { locale });
		return `${t('today')}, ${formattedDate}`;
	}

	const formattedDate = format(codeTime, 'eee, dd MMMM yyyy', { locale });
	return formattedDate;
};
