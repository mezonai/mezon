import { MezonIcon, MzIcons16 } from '@mezon/ui';
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
				<span className="inline-flex">
					<MezonIcon icon={MzIcons16.mzChevronUpDown} className="-my-1 text-[#5865F2]" />
				</span>
			</Tooltip>
		);
	}
	if (sort === 'asc') {
		// Ascending - only top arrow enabled
		return (
			<Tooltip overlay={tooltipText} placement="top">
				<span className="inline-flex">
					<MezonIcon icon={MzIcons16.mzCaretUp} className="-my-1 text-[#5865F2]" />
				</span>
			</Tooltip>
		);
	}
	// Descending - only bottom arrow enabled
	return (
		<Tooltip overlay={tooltipText} placement="top">
			<span className="inline-flex">
				<MezonIcon icon={MzIcons16.mzCaretDown} className="-my-1 text-[#5865F2]" />
			</span>
		</Tooltip>
	);
}

export default SortIcon;
