import React from 'react';
import { useTranslation } from 'react-i18next';
import CategoryChips from './CategoryChips';

interface EmptyDiscoverStateProps {
	query?: string;
	hasFilters?: boolean;
	onClearSearch: () => void;
	onClearFilters: () => void;
	selectedHashtags?: string[];
	onHashtagSelect: (tag: string) => void;
}

const EmptyDiscoverState: React.FC<EmptyDiscoverStateProps> = ({
	query,
	hasFilters,
	onClearSearch,
	onClearFilters,
	selectedHashtags,
	onHashtagSelect
}) => {
	const { t } = useTranslation('discover');

	if (query && query.length >= 2) {
		return (
			<div className="text-center py-16 px-4">
				<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{t('empty.searchTitle', { query })}</h3>
				<p className="text-[var(--text-secondary)] mb-6">{t('empty.searchHint')}</p>
				<button
					type="button"
					onClick={onClearSearch}
					className="min-h-[44px] px-5 rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4]"
				>
					{t('empty.clearSearch')}
				</button>
				<div className="mt-8">
					<CategoryChips selectedHashtags={selectedHashtags} onSelect={onHashtagSelect} variant="recovery" />
				</div>
			</div>
		);
	}

	if (hasFilters) {
		return (
			<div className="text-center py-16 px-4">
				<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{t('empty.filterTitle')}</h3>
				<button
					type="button"
					onClick={onClearFilters}
					className="mt-4 min-h-[44px] px-5 rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4]"
				>
					{t('empty.clearFilters')}
				</button>
			</div>
		);
	}

	return (
		<div className="text-center py-16 px-4">
			<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{t('empty.genericTitle')}</h3>
			<p className="text-[var(--text-secondary)]">{t('empty.genericHint')}</p>
		</div>
	);
};

export default EmptyDiscoverState;
