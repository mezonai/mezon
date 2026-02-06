import { formatDateI18n } from '@mezon/utils';
import { useTranslation } from 'react-i18next';

type TimelineDateBadgeProps = {
	timestamp?: number;
};

const TimelineDateBadge = ({ timestamp }: TimelineDateBadgeProps) => {
	const { i18n } = useTranslation();

	if (!timestamp) return null;

	const date = new Date(timestamp * 1000);
	const month = formatDateI18n(date, i18n.language, 'MMM');
	const day = formatDateI18n(date, i18n.language, 'dd');
	const year = formatDateI18n(date, i18n.language, 'yyyy');

	return (
		<div className="timeline-date flex flex-col items-center min-w-[60px] text-center">
			<span className="text-xs text-gray-500 text-theme-primary-hover text-theme-primary uppercase">{month}</span>
			<span className="text-2xl font-bold text-theme-primary-hover text-theme-primary">{day}</span>
			<span className="text-xs text-gray-500 text-theme-primary-hover text-theme-primary">{year}</span>
		</div>
	);
};

export default TimelineDateBadge;
