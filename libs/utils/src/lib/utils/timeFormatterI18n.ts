export const timeFormatI18n = (start: string, t: (key: string, options?: any) => string) => {
	const date = new Date(start);

	const daysOfWeek = [
		t('timeFormat.daysOfWeek.sun'),
		t('timeFormat.daysOfWeek.mon'),
		t('timeFormat.daysOfWeek.tue'),
		t('timeFormat.daysOfWeek.wed'),
		t('timeFormat.daysOfWeek.thu'),
		t('timeFormat.daysOfWeek.fri'),
		t('timeFormat.daysOfWeek.sat')
	];
	const dayName = daysOfWeek[date.getDay()];

	const months = [
		t('timeFormat.months.jan'),
		t('timeFormat.months.feb'),
		t('timeFormat.months.mar'),
		t('timeFormat.months.apr'),
		t('timeFormat.months.may'),
		t('timeFormat.months.jun'),
		t('timeFormat.months.jul'),
		t('timeFormat.months.aug'),
		t('timeFormat.months.sep'),
		t('timeFormat.months.oct'),
		t('timeFormat.months.nov'),
		t('timeFormat.months.dec')
	];
	const monthName = months[date.getMonth()];

	const day = date.getDate();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');

	return t('timeFormat.fullDate', {
		dayName,
		day,
		monthName,
		hours,
		minutes
	});
};

export function getDayWeekNameI18n(date: Date, t: (key: string) => string) {
	const day = date.toLocaleDateString('en', { weekday: 'long' });
	const weekOfMonth = Math.ceil(date.getDate() / 7) - 1;

	const weekNames = [
		t('timeFormat.weekNames.first'),
		t('timeFormat.weekNames.second'),
		t('timeFormat.weekNames.third'),
		t('timeFormat.weekNames.fourth'),
		t('timeFormat.weekNames.fifth')
	];

	return `${weekNames[weekOfMonth]} ${day}`;
}

export function convertTimestampToTimeAgoI18n(timestampSeconds: number, t: (key: string, options?: any) => string) {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - timestampSeconds;

	const years = Math.floor(diff / (60 * 60 * 24 * 365));
	const months = Math.floor((diff % (60 * 60 * 24 * 365)) / (60 * 60 * 24 * 30));
	const days = Math.floor((diff % (60 * 60 * 24 * 30)) / (60 * 60 * 24));
	const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
	const minutes = Math.floor((diff % (60 * 60)) / 60);

	switch (true) {
		case years > 0:
			return t('timeFormat.timeAgo.years', { count: years });
		case months > 0:
			return t('timeFormat.timeAgo.months', { count: months });
		case days > 0:
			return t('timeFormat.timeAgo.days', { count: days });
		case hours > 0:
			return t('timeFormat.timeAgo.hours', { count: hours });
		case minutes > 0:
			return t('timeFormat.timeAgo.minutes', { count: minutes });
		default:
			return t('timeFormat.timeAgo.justNow');
	}
}
