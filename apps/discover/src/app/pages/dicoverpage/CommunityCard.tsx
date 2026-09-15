import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from '../../components/common/ImageWithSkeleton';
import { formatCompactNumber, getClanHref, getClanInitials, type DiscoverClan } from './communityUtils';

export type CommunityCardVariant = 'default' | 'featured' | 'spotlight' | 'compact';

interface CommunityCardProps {
	clan: DiscoverClan;
	variant?: CommunityCardVariant;
	carousel?: boolean;
	priority?: boolean;
	section?: string;
	position?: number;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}

const VerifiedBadge = ({ className = 'w-4 h-4 text-[#f0abfc]' }: { className?: string }) => (
	<svg className={`shrink-0 ${className}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
		<path
			fillRule="evenodd"
			d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
			clipRule="evenodd"
		/>
	</svg>
);

const CoverFallback = ({ name }: { name: string }) => (
	<div className="absolute inset-0 bg-[image:var(--gradient-brand-hero)] flex items-center justify-center">
		<span className="text-white/90 text-2xl font-bold tracking-wide">{getClanInitials(name)}</span>
	</div>
);

const AvatarFace = ({
	clan,
	clanName,
	error,
	onError,
	priority,
	className
}: {
	clan: DiscoverClan;
	clanName: string;
	error: boolean;
	onError: () => void;
	priority?: boolean;
	className: string;
}) => (
	<div className={`overflow-hidden bg-[var(--surface-muted)] ${className}`}>
		{clan.clan_logo && !error ? (
			<ImageWithSkeleton
				src={clan.clan_logo}
				alt=""
				className="w-full h-full object-cover"
				onError={onError}
				loading={priority ? 'eager' : 'lazy'}
			/>
		) : (
			<div className="w-full h-full flex items-center justify-center bg-[image:var(--gradient-brand-hero)] text-white text-sm font-semibold">
				{getClanInitials(clanName)}
			</div>
		)}
	</div>
);

const CommunityCard: React.FC<CommunityCardProps> = ({
	clan,
	variant = 'default',
	carousel = false,
	priority = false,
	section,
	position,
	onSelect
}) => {
	const { t, i18n } = useTranslation('discover');
	const [bannerError, setBannerError] = useState(false);
	const [logoError, setLogoError] = useState(false);
	const clanName = clan.clan_name || t('detail.unnamed');
	const href = getClanHref(clan);
	const memberLabel = t('statsLine', { members: formatCompactNumber(clan.total_members, i18n.language) });
	const ariaLabel = t('a11y.communityCard', {
		name: clanName,
		verified: clan.verified ? `, ${t('a11y.verified')}` : '',
		members: memberLabel
	});
	const isSpotlight = variant === 'spotlight';

	if (isSpotlight) {
		return (
			<Link
				to={href}
				aria-label={ariaLabel}
				onClick={() => onSelect?.(clan, { section, position })}
				className="discover-card-motion group relative block w-full overflow-hidden rounded-[24px] min-h-[280px] md:min-h-[360px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]"
			>
				<div className="absolute inset-0 bg-[var(--surface-ink)]">
					{clan.banner && !bannerError ? (
						<ImageWithSkeleton
							src={clan.banner}
							alt=""
							className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500 motion-reduce:transition-none"
							onError={() => setBannerError(true)}
							loading={priority ? 'eager' : 'lazy'}
							fetchPriority={priority ? 'high' : 'auto'}
						/>
					) : (
						<CoverFallback name={clanName} />
					)}
				</div>
				<div className="absolute inset-0 bg-[image:var(--gradient-cover-fade)]" />
				<div className="relative flex h-full min-h-[280px] md:min-h-[360px] flex-col justify-end p-5 md:p-8">
					<span className="mb-4 inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
						{t('featuredBadge')}
					</span>
					<div className="flex items-end gap-4">
						<AvatarFace
							clan={clan}
							clanName={clanName}
							error={logoError}
							onError={() => setLogoError(true)}
							priority={priority}
							className="w-16 h-16 md:w-20 md:h-20 rounded-[18px] ring-4 ring-white/20 shrink-0"
						/>
						<div className="min-w-0 pb-1">
							<div className="flex items-center gap-2 min-w-0">
								<h3 className="text-[28px] md:text-[40px] leading-none font-extrabold tracking-[-0.03em] text-white truncate">
									{clanName}
								</h3>
								{clan.verified ? <VerifiedBadge className="w-5 h-5 text-white" /> : null}
							</div>
							<p className="mt-2 max-w-2xl text-sm md:text-base text-white/80 line-clamp-2">
								{clan.description || t('card.fallbackDescription')}
							</p>
							<p className="mt-3 text-sm font-medium text-white/70">{memberLabel}</p>
						</div>
					</div>
				</div>
			</Link>
		);
	}

	return (
		<Link
			to={href}
			aria-label={ariaLabel}
			onClick={() => onSelect?.(clan, { section, position })}
			className={`discover-card-motion group flex flex-col bg-[var(--surface-card)] rounded-[20px] overflow-visible min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)] ${
				carousel ? 'w-[min(86vw,320px)] shrink-0 snap-start' : 'w-full'
			}`}
		>
			<div className="relative w-full aspect-[16/9] rounded-[20px] overflow-hidden bg-[var(--surface-ink)]">
				{clan.banner && !bannerError ? (
					<ImageWithSkeleton
						src={clan.banner}
						alt=""
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none"
						onError={() => setBannerError(true)}
						loading={priority ? 'eager' : 'lazy'}
						fetchPriority={priority ? 'high' : 'auto'}
					/>
				) : (
					<CoverFallback name={clanName} />
				)}
			</div>
			<div className="relative px-1 pt-0 pb-3">
				<AvatarFace
					clan={clan}
					clanName={clanName}
					error={logoError}
					onError={() => setLogoError(true)}
					priority={priority}
					className="w-12 h-12 rounded-[14px] ring-4 ring-[var(--surface-page)] -mt-6 ml-3 shadow-md"
				/>
				<div className="px-3 mt-3">
					<div className="flex items-center gap-1.5 min-w-0">
						<h3 className="text-[17px] leading-6 font-bold text-[var(--text-primary)] truncate">{clanName}</h3>
						{clan.verified ? (
							<>
								<span className="inline-flex shrink-0 text-[var(--color-brand-primary)]" aria-hidden>
									<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										/>
									</svg>
								</span>
								<span className="sr-only">{t('verified')}</span>
							</>
						) : null}
					</div>
					<p className="mt-1 text-[14px] leading-5 text-[var(--text-secondary)] line-clamp-2 min-h-[40px]">
						{clan.description || t('card.fallbackDescription')}
					</p>
					<p className="mt-2 text-[13px] font-medium text-[var(--text-muted-discover)]">{memberLabel}</p>
				</div>
			</div>
		</Link>
	);
};

export const CommunityCardSkeleton: React.FC<{ carousel?: boolean; spotlight?: boolean }> = ({ carousel = false, spotlight = false }) => {
	if (spotlight) {
		return <div className="w-full min-h-[280px] md:min-h-[360px] rounded-[24px] skeleton" aria-hidden />;
	}
	return (
		<div className={carousel ? 'w-[min(86vw,320px)] shrink-0' : 'w-full'} aria-hidden>
			<div className="aspect-[16/9] rounded-[20px] skeleton" />
			<div className="px-3 pt-4 space-y-2">
				<div className="h-4 w-1/2 rounded skeleton" />
				<div className="h-4 w-full rounded skeleton" />
			</div>
		</div>
	);
};

export default CommunityCard;
