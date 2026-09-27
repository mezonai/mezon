import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORY_SHORTCUTS } from '../../constants/constants';

interface CategoryChipsProps {
	selectedCategory: string;
	onSelect: (categoryId: string) => void;
	variant?: 'hero' | 'recovery' | 'stage';
}

const CategoryChips: React.FC<CategoryChipsProps> = ({ selectedCategory, onSelect, variant = 'hero' }) => {
	const { t } = useTranslation('discover');
	const [showAll, setShowAll] = useState(false);
	const visible = showAll ? CATEGORY_SHORTCUTS : CATEGORY_SHORTCUTS.slice(0, 6);

	return (
		<div className={variant !== 'recovery' ? 'overflow-x-auto scrollbar-hide hide-scrollbar' : ''}>
			<div className={`flex ${variant === 'recovery' ? 'flex-wrap justify-center' : 'flex-nowrap justify-start'} gap-2 pb-1`}>
				{visible.map((category) => {
					const selected = selectedCategory === category.id;
					const stage = variant === 'stage';
					return (
						<button
							key={category.id}
							type="button"
							onClick={() => onSelect(category.id)}
							className={`h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
								stage
									? selected
										? 'bg-white text-[#6E4A9E]'
										: 'bg-[#131221]/55 text-white backdrop-blur-[6px] hover:bg-[#131221]/75'
									: selected
										? 'bg-[#8960e0] text-white'
										: 'bg-[#8960e0]/10 text-[#6E4A9E] hover:bg-[#8960e0]/20'
							}`}
							aria-pressed={selected}
						>
							{t(`categories.${category.id}`)}
							{selected ? ' ×' : ''}
						</button>
					);
				})}
				{!showAll && CATEGORY_SHORTCUTS.length > 6 ? (
					<button
						type="button"
						onClick={() => setShowAll(true)}
						className={`h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap bg-transparent ${
							variant === 'stage' ? 'text-[#de82e6] drop-shadow-[0_1px_8px_rgba(19,18,33,0.9)]' : 'text-[var(--color-brand-primary)]'
						}`}
					>
						{t('more')} ›
					</button>
				) : null}
			</div>
		</div>
	);
};

export default CategoryChips;
