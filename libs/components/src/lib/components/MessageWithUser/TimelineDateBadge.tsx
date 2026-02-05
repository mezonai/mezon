type TimelineDateBadgeProps = {
	timestamp?: number;
};

const TimelineDateBadge = ({ timestamp }: TimelineDateBadgeProps) => {
	if (!timestamp) return null;

	const date = new Date(timestamp * 1000);
	const month = date.toLocaleString('en', { month: 'short' });
	const day = date.getDate().toString().padStart(2, '0');
	const year = date.getFullYear();

	return (
		<div className="timeline-date flex flex-col items-center min-w-[60px] text-center">
			<span className="text-xs text-gray-500 text-theme-primary-hover text-theme-primary uppercase">{month}</span>
			<span className="text-2xl font-bold text-theme-primary-hover text-theme-primary">{day}</span>
			<span className="text-xs text-gray-500 text-theme-primary-hover text-theme-primary">{year}</span>
		</div>
	);
};

export default TimelineDateBadge;
