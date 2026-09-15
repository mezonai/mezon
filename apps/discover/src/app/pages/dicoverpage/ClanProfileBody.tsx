import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getClanHashtags, splitClanStory, type DiscoverClan } from './communityUtils';

interface ClanProfileBodyProps {
	clan: DiscoverClan;
}

export default function ClanProfileBody({ clan }: ClanProfileBodyProps) {
	const { t } = useTranslation('discover');
	const [aboutExpanded, setAboutExpanded] = useState(false);
	const tags = getClanHashtags(clan);
	const { lede, body } = splitClanStory(clan);
	const shouldClamp = body.length > 420;
	const hasStory = Boolean(lede || body);

	return (
		<article className="bg-[var(--surface-page)] px-4 md:px-8 lg:px-12 py-14 md:py-20 lg:py-28">
			{hasStory ? (
				<div className="max-w-5xl">
					{lede ? (
						<p className="max-w-4xl text-[1.35rem] sm:text-[1.65rem] md:text-[2.15rem] lg:text-[2.5rem] leading-[1.22] font-medium tracking-[-0.03em] text-[#131221]">
							{lede}
						</p>
					) : null}

					{lede && body ? <div className="mt-8 md:mt-12 mb-8 md:mb-12 h-px w-12 md:w-16 bg-[#131221]/20" aria-hidden /> : null}

					{body ? (
						<div className={lede ? 'md:pl-10 lg:pl-20' : ''}>
							<p
								className={`max-w-[80rem] text-[16px] sm:text-[17px] md:text-[18px] leading-7 md:leading-8 text-[#3f4a5a] whitespace-pre-wrap ${
									!aboutExpanded && shouldClamp ? 'line-clamp-8' : ''
								}`}
							>
								{body}
							</p>
							{shouldClamp ? (
								<button
									type="button"
									onClick={() => setAboutExpanded((open) => !open)}
									className="mt-6 min-h-[48px] px-6 rounded-full bg-[#8960e0] text-white text-sm font-semibold hover:bg-[#7a52d4]"
								>
									{aboutExpanded ? t('detail.readLess') : t('detail.readMore')}
								</button>
							) : null}
						</div>
					) : null}
				</div>
			) : (
				<p className="max-w-2xl text-lg text-[#7c92af]">{t('detail.noDescription')}</p>
			)}

			{tags.length > 0 ? (
				<ul className={`flex flex-wrap gap-2 ${hasStory ? 'mt-14 md:mt-20 pt-8 border-t border-[#131221]/10' : ''}`}>
					{tags.map((tag) => (
						<li key={tag}>
							<Link
								to={`/clans?q=${encodeURIComponent(tag)}`}
								className="inline-flex h-9 items-center px-3.5 rounded-full bg-[#8960e0]/10 text-sm font-medium text-[#6E4A9E] hover:bg-[#8960e0] hover:text-white transition-colors"
							>
								#{tag}
							</Link>
						</li>
					))}
				</ul>
			) : null}
		</article>
	);
}
