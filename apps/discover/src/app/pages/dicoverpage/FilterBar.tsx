import React, { useEffect, useId, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DISCOVER_HASHTAGS, type DiscoverSort } from '../../constants/constants';

interface FilterSheetProps {
	open: boolean;
	onClose: () => void;
	selectedCategory?: string;
	selectedHashtags?: string[];
	verifiedOnly: boolean;
	onCategorySelect?: (category: string) => void;
	onHashtagToggle?: (tag: string) => void;
	onVerifiedOnly: (value: boolean) => void;
	onReset: () => void;
	resultCount: number;
}

const FilterSheet: React.FC<FilterSheetProps> = ({
	open,
	onClose,
	selectedCategory = '',
	selectedHashtags,
	verifiedOnly,
	onCategorySelect,
	onHashtagToggle,
	onVerifiedOnly,
	onReset,
	resultCount
}) => {
	const { t } = useTranslation(['discover', 'onBoardingClan']);
	const titleId = useId();
	const closeRef = useRef<HTMLButtonElement>(null);

	const activeTags = useMemo(() => {
		if (selectedHashtags && selectedHashtags.length > 0) return selectedHashtags;
		if (selectedCategory) {
			return selectedCategory
				.split(',')
				.map((t) => t.trim().replace(/^#/, ''))
				.filter(Boolean);
		}
		return [];
	}, [selectedHashtags, selectedCategory]);

	const handleToggle = (tag: string) => {
		if (onHashtagToggle) onHashtagToggle(tag);
		else if (onCategorySelect) onCategorySelect(tag);
	};

	useEffect(() => {
		if (!open) return;
		closeRef.current?.focus();
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKeyDown);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 lg:hidden">
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="absolute inset-y-0 right-0 w-full max-w-sm bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl flex flex-col"
			>
				<div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
					<h2 id={titleId} className="text-base font-semibold">
						{t('filters.title')}
					</h2>
					<div className="flex items-center gap-2">
						<button
							ref={closeRef}
							type="button"
							className="text-sm font-medium text-[var(--color-brand-primary)] min-h-[44px] px-2"
							onClick={onReset}
						>
							{t('filters.reset')}
						</button>
					</div>
				</div>
				<div className="px-4 py-4 space-y-6 flex-1 overflow-y-auto">
					<fieldset>
						<legend className="text-sm font-semibold text-[var(--text-primary)] mb-3">
							{t('communitySettings.hashtags.title', { ns: 'onBoardingClan', defaultValue: 'Hashtags' })}
						</legend>
						<div className="space-y-1">
							{DISCOVER_HASHTAGS.map((tag) => {
								const checked = activeTags.some((t) => t.toLowerCase() === tag.toLowerCase());
								return (
									<label key={tag} className="flex items-center gap-3 min-h-[44px] cursor-pointer">
										<input
											type="checkbox"
											checked={checked}
											onChange={() => handleToggle(tag)}
											className="w-4 h-4 rounded text-[#8960e0] focus:ring-[#8960e0]"
										/>
										<span className="text-sm text-[var(--text-primary)]">
											#{t(`communitySettings.hashtags.items.${tag}`, { ns: 'onBoardingClan', defaultValue: tag })}
										</span>
									</label>
								);
							})}
						</div>
					</fieldset>
					<label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
						<input
							type="checkbox"
							checked={verifiedOnly}
							onChange={(event) => onVerifiedOnly(event.target.checked)}
							className="w-4 h-4 rounded text-[#8960e0] focus:ring-[#8960e0]"
						/>
						<span className="text-sm text-[var(--text-primary)]">{t('filters.verifiedOnly')}</span>
					</label>
				</div>
				<div className="sticky bottom-0 p-4 bg-[var(--surface-card)] border-t border-[var(--border-subtle)] pb-[max(16px,env(safe-area-inset-bottom))]">
					<button
						type="button"
						onClick={onClose}
						className="w-full min-h-[48px] rounded-full bg-[#8960e0] text-white font-semibold hover:bg-[#7a52d4]"
					>
						{t('filters.showResults')} ({resultCount})
					</button>
				</div>
			</div>
		</div>
	);
};

interface FilterBarProps {
	verifiedOnly: boolean;
	sort: DiscoverSort;
	onVerifiedOnly: (value: boolean) => void;
	onSortChange: (sort: DiscoverSort) => void;
	onOpenMobileFilters: () => void;
	activeFilterCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ verifiedOnly, sort, onVerifiedOnly, onSortChange, onOpenMobileFilters, activeFilterCount }) => {
	const { t } = useTranslation('discover');

	return (
		<div className="sticky top-[var(--navbar-height)] z-20 py-3 bg-[#f4f7f9]/95 backdrop-blur-sm">
			<div className="flex items-center justify-between gap-3">
				<button
					type="button"
					onClick={onOpenMobileFilters}
					className="md:hidden inline-flex items-center min-h-[44px] px-0 text-sm font-medium border-b border-[#131221]"
				>
					{t('filters.open')}
					{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
				</button>
				<div className="hidden md:flex items-center gap-4">
					<label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] min-h-[44px]">
						<input type="checkbox" checked={verifiedOnly} onChange={(event) => onVerifiedOnly(event.target.checked)} />
						{t('filters.verifiedOnly')}
					</label>
				</div>
				<label className="ml-auto inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
					<span className="sr-only md:not-sr-only">{t('sort.label')}</span>
					<select
						value={sort}
						onChange={(event) => onSortChange(event.target.value as DiscoverSort)}
						className="min-h-[40px] rounded-none border-0 border-b border-[#131221] bg-transparent px-0 pr-6 text-sm font-medium text-[var(--text-primary)]"
					>
						<option value="recommended">{t('sort.recommended')}</option>
						<option value="largest">{t('sort.largest')}</option>
						<option value="newest">{t('sort.newest')}</option>
					</select>
				</label>
			</div>
		</div>
	);
};

export default FilterSheet;
