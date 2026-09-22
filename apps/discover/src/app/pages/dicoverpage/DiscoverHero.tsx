import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface DiscoverHeroProps {
	searchTerm: string;
	onSearch: (term: string) => void;
	children?: React.ReactNode;
}

const DiscoverHero: React.FC<DiscoverHeroProps> = ({ searchTerm, onSearch, children }) => {
	const { t } = useTranslation('discover');
	const searchInputRef = useRef<HTMLInputElement>(null);
	const title = t('title');
	const highlight = t('titleHighlight');
	const highlightedTitle = highlight && title.includes(highlight) ? title.split(highlight) : null;

	return (
		<section className="relative bg-[var(--surface-page)] border-b border-[var(--border-subtle)]">
			<div className="mx-auto w-full max-w-[1240px] px-4 md:px-6 lg:px-8 pt-8 md:pt-10 pb-6 md:pb-8">
				<p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand-primary)] mb-3">{t('overline')}</p>
				<h1 className="max-w-[16ch] text-[36px] leading-[1.1] md:text-[52px] md:leading-[1.05] font-extrabold tracking-[-0.03em] text-[var(--text-primary)] mb-3">
					{highlightedTitle ? (
						<>
							{highlightedTitle[0]}
							<span className="text-[var(--color-brand-primary)]">{highlight}</span>
							{highlightedTitle[1]}
						</>
					) : (
						title
					)}
				</h1>
				<p className="max-w-xl text-[16px] md:text-[18px] leading-7 text-[var(--text-secondary)] mb-6">{t('subtitle')}</p>

				<form
					className="max-w-[560px]"
					onSubmit={(event) => {
						event.preventDefault();
						searchInputRef.current?.blur();
					}}
				>
					<div className="relative">
						<label htmlFor="discover-search" className="sr-only">
							{t('searchLabel')}
						</label>
						<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
							<svg
								className="h-5 w-5 text-[var(--text-muted-discover)]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							id="discover-search"
							ref={searchInputRef}
							type="search"
							value={searchTerm}
							onChange={(event) => onSearch(event.target.value)}
							placeholder={t('searchPlaceholder')}
							autoComplete="off"
							className="block w-full h-12 md:h-14 pl-11 pr-11 rounded-full border border-[var(--border-default)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted-discover)] shadow-[0_8px_30px_rgba(124,58,237,0.08)] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-200 focus-visible:border-[var(--color-brand-primary)]"
						/>
						{searchTerm ? (
							<button
								type="button"
								className="absolute inset-y-0 right-0 pr-3 flex items-center min-w-[44px] justify-center"
								onClick={() => onSearch('')}
								aria-label={t('empty.clearSearch')}
							>
								<svg
									className="h-5 w-5 text-[var(--text-muted-discover)]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						) : null}
					</div>
				</form>
				<div className="mt-5">{children}</div>
			</div>
		</section>
	);
};

export default DiscoverHero;
