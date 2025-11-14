export function formatUpdatedTime(utcString: string): string {
	const date = new Date(utcString);
	const now = new Date();

	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return 'Just now';
	if (diffMin < 60) return `${diffMin} min ago`;
	if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
	if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	});
}
