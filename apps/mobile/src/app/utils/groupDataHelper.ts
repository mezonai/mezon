// Shared date/time and grouping utilities for mobile app

export const formatDateHeader = (date: Date, locale?: string): string => {
	const detectedLocale = (locale || Intl.DateTimeFormat().resolvedOptions().locale || 'en').toLowerCase();
	const day = `${date.getDate()}`.padStart(2, '0');
	const monthNumber = `${date.getMonth() + 1}`.padStart(2, '0');
	const year = `${date.getFullYear()}`;
	if (detectedLocale.startsWith('vi')) {
		return `${day} tháng ${monthNumber}, ${year}`;
	}
	const parts = new Intl.DateTimeFormat('en', { day: '2-digit', month: 'long', year: 'numeric' }).formatToParts(date);
	const partMap: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
	return `${partMap.month} ${partMap.day}, ${partMap.year}`;
};

// Returns timestamp at local start-of-day for stable grouping/sorting
export const getStartOfDayTs = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Generic helper to parse common timestamp shapes used by attachments
export const parseAttachmentLikeDate = (obj: any): Date => {
	const seconds = obj?.createTimeSeconds || obj?.timestampSeconds;
	if (typeof seconds === 'number') return new Date(seconds * 1000);
	const tsString = obj?.createTime || obj?.timestamp || obj?.createdAt;
	if (typeof tsString === 'string') {
		const d = new Date(tsString);
		if (!Number.isNaN(d.getTime())) return d;
	}
	return new Date();
};

export type YearDayGroup<T> = {
	year: string;
	dayTs: number;
	items: T[];
	isFirstOfYear?: boolean;
};

// Groups items by year and local day (start of day), sorted descending by date
export const groupByYearDay = <T>(items: T[], getDate: (item: T) => Date): YearDayGroup<T>[] => {
	if (!items || items.length === 0) return [];

	const sorted = [...items].sort((a, b) => getDate(b).getTime() - getDate(a).getTime());

	const map: Record<string, Record<number, T[]>> = {};
	for (const it of sorted) {
		const d = getDate(it);
		const year = String(d.getFullYear());
		const dayKey = getStartOfDayTs(d);
		if (!map[year]) map[year] = {};
		if (!map[year][dayKey]) map[year][dayKey] = [] as T[];
		map[year][dayKey].push(it);
	}

	const result: YearDayGroup<T>[] = [];
	const years = Object.keys(map).sort((a, b) => Number(b) - Number(a));
	years.forEach((year) => {
		const days = Object.keys(map[year])
			.map((v) => Number(v))
			.sort((a, b) => b - a);
		days.forEach((dayTs, idx) => {
			result.push({ year, dayTs, items: map[year][dayTs], isFirstOfYear: idx === 0 });
		});
	});
	return result;
};
