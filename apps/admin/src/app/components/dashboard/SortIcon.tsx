import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import { useTranslation } from 'react-i18next';

interface SortIconProps {
	column: string;
	sortBy?: string;
	sort?: 'asc' | 'desc';
}

function SortIcon({ column, sortBy, sort }: SortIconProps) {
	const { t } = useTranslation('dashboard');
	const tooltipText = sortBy !== column ? t('sortIcon.tooltip') : sort === 'asc' ? t('sortIcon.sortedAsc') : t('sortIcon.sortedDesc');

	if (sortBy !== column) {
		// Not sorted - both arrows enabled
		return (
			<Tooltip overlay={tooltipText} placement="top">
				<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
					<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" />
					<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" />
				</svg>
			</Tooltip>
		);
	}
	if (sort === 'asc') {
		// Ascending - only top arrow enabled
		return (
			<Tooltip overlay={tooltipText} placement="top">
				<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
					<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" />
					<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" opacity="0.3" />
				</svg>
			</Tooltip>
		);
	}
	// Descending - only bottom arrow enabled
	return (
		<Tooltip overlay={tooltipText} placement="top">
			<svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="-my-1">
				<path d="M5 2L8 6H2L5 2Z" fill="#5865F2" opacity="0.3" />
				<path d="M5 14L2 10H8L5 14Z" fill="#5865F2" />
			</svg>
		</Tooltip>
	);
}

export default SortIcon;
