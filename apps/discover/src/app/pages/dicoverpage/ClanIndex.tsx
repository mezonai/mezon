import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from '../../components/common/ImageWithSkeleton';
import ClanLiveStats from './ClanLiveStats';
import { getClanHashtags, getClanHref, getClanInitials, type DiscoverClan } from './communityUtils';

interface ClanIndexProps {
	clans: DiscoverClan[];
	loading?: boolean;
	startIndex?: number;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}

const ClanIndex: React.FC<ClanIndexProps> = ({ clans, loading, startIndex = 0, onSelect }) => {
	if (loading) {
		return (
			<div className="space-y-8 py-8">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="flex items-center gap-6">
						<div className="h-16 w-16 rounded-full skeleton" />
						<div className="flex-1 h-16 skeleton rounded-none" />
					</div>
				))}
			</div>
		);
	}

	return (
		<ol>
			{clans.map((clan, index) => (
				<IndexRow key={clan.clan_id || clan.short_url || index} clan={clan} index={startIndex + index} onSelect={onSelect} />
			))}
		</ol>
	);
};

const IndexRow = ({
	clan,
	index,
	onSelect
}: {
	clan: DiscoverClan;
	index: number;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}) => {
	const { t } = useTranslation('discover');
	const [error, setError] = useState(false);
	const name = clan.clan_name || t('detail.unnamed');
	const src = clan.banner || clan.clan_logo;
	const flip = index % 2 === 1;

	return (
		<li className="border-t border-[#131221]/10">
			<Link
				to={getClanHref(clan)}
				onClick={() => onSelect?.(clan, { section: 'index', position: index })}
				className="group grid grid-cols-12 gap-3 md:gap-8 items-center py-8 md:py-12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5865f2]"
			>
				<span className="col-span-2 text-3xl md:text-6xl font-light tabular-nums text-[#5865f2]/35 group-hover:text-[#5865f2] transition-colors">
					{String(index + 1).padStart(2, '0')}
				</span>
				{flip ? (
					<>
						<div className="col-span-3 md:col-span-3 flex justify-start">
							<IndexAvatar name={name} src={src} error={error} onError={() => setError(true)} />
						</div>
						<div className="col-span-7 md:col-span-7 text-right">
							<IndexCopy name={name} clan={clan} align="right" />
						</div>
					</>
				) : (
					<>
						<div className="col-span-7 md:col-span-7">
							<IndexCopy name={name} clan={clan} />
						</div>
						<div className="col-span-3 md:col-span-3 flex justify-end">
							<IndexAvatar name={name} src={src} error={error} onError={() => setError(true)} />
						</div>
					</>
				)}
			</Link>
		</li>
	);
};

const IndexCopy = ({ name, clan, align = 'left' }: { name: string; clan: DiscoverClan; align?: 'left' | 'right' }) => {
	const { t } = useTranslation(['discover', 'onBoardingClan']);
	const tags = getClanHashtags(clan);

	return (
		<>
			<h3 className="text-[28px] md:text-[56px] leading-[0.9] font-extrabold tracking-[-0.05em] text-[#131221] group-hover:text-[#5865f2] transition-colors break-words">
				{name}
			</h3>
			<p className="mt-3 text-sm md:text-base text-[#7c92af] line-clamp-2">{clan.description || t('card.fallbackDescription')}</p>
			{tags.length > 0 ? (
				<div className={`mt-3 flex flex-wrap items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
					{tags.map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#8960e0]/10 text-[#6E4A9E] border border-[#8960e0]/15 group-hover:border-[#5865f2]/25 group-hover:bg-[#5865f2]/10 group-hover:text-[#5865f2] transition-colors"
						>
							<span className="font-bold opacity-60">#</span>
							<span>{t(`communitySettings.hashtags.items.${tag}`, { ns: 'onBoardingClan', defaultValue: tag })}</span>
						</span>
					))}
				</div>
			) : null}
			<ClanLiveStats clan={clan} align={align} className="mt-3 text-xs tracking-[0.18em] uppercase text-[#8960e0]" />
		</>
	);
};

const IndexAvatar = ({ name, src, error, onError }: { name: string; src?: string; error: boolean; onError: () => void }) => (
	<div className="w-16 h-16 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-[#8960e0]/25 group-hover:ring-[#5865f2] group-hover:rotate-6 transition-transform duration-300 motion-reduce:transform-none bg-[#404eed]">
		{src && !error ? (
			<ImageWithSkeleton src={src} alt="" className="w-full h-full object-cover" onError={onError} loading="lazy" />
		) : (
			<div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{getClanInitials(name)}</div>
		)}
	</div>
);

export default ClanIndex;
