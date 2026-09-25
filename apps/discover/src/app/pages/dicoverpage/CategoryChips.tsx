import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DISCOVER_HASHTAGS } from '../../constants/constants';

interface CategoryChipsProps {
	selectedHashtags?: string[];
	onSelect: (tag: string) => void;
	variant?: 'hero' | 'recovery' | 'stage';
}

const CategoryChips: React.FC<CategoryChipsProps> = ({ selectedHashtags = [], onSelect, variant = 'hero' }) => {
	const { t } = useTranslation(['discover', 'onBoardingClan']);
	const [showAll, setShowAll] = useState(false);

	const activeTags = selectedHashtags;

	const visible = showAll ? DISCOVER_HASHTAGS : DISCOVER_HASHTAGS.slice(0, 6);

	return (
		<div className={variant !== 'recovery' ? 'overflow-x-auto scrollbar-hide hide-scrollbar' : ''}>
			<div className={`flex ${variant === 'recovery' ? 'flex-wrap justify-center' : 'flex-nowrap justify-start'} gap-2 pb-1`}>
				{visible.map((tag) => {
					const selected = activeTags.some((t) => t.toLowerCase() === tag.toLowerCase());
					const stage = variant === 'stage';
					return (
						<button
							key={tag}
							type="button"
							onClick={() => onSelect(tag)}
							className={`h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
								stage
									? selected
										? 'bg-white text-[#6E4A9E] shadow-sm'
										: 'bg-[#131221]/55 text-white backdrop-blur-[6px] hover:bg-[#131221]/75 border border-white/10'
									: selected
										? 'bg-[#8960e0] text-white'
										: 'bg-[#8960e0]/10 text-[#6E4A9E] hover:bg-[#8960e0]/20'
							}`}
							aria-pressed={selected}
						>
							<span className="font-bold opacity-60">#</span>
							<span>{t(`communitySettings.hashtags.items.${tag}`, { ns: 'onBoardingClan', defaultValue: tag })}</span>
							{selected ? <span className="ml-0.5 font-bold">×</span> : null}
						</button>
					);
				})}
				{!showAll && DISCOVER_HASHTAGS.length > 6 ? (
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
