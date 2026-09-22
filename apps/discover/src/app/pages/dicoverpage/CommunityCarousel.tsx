import React from 'react';
import CommunityCard, { CommunityCardSkeleton } from './CommunityCard';
import type { DiscoverClan } from './communityUtils';

interface CommunityCarouselProps {
	clans: DiscoverClan[];
	loading?: boolean;
	section?: string;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}

const CommunityCarousel: React.FC<CommunityCarouselProps> = ({ clans, loading, section = 'featured', onSelect }) => {
	if (loading) {
		return (
			<div className="flex gap-4 overflow-hidden">
				{Array.from({ length: 3 }).map((_, index) => (
					<CommunityCardSkeleton key={`featured-skeleton-${index}`} carousel />
				))}
			</div>
		);
	}

	return (
		<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide hide-scrollbar pb-2 -mx-4 px-4">
			{clans.map((clan, index) => (
				<CommunityCard
					key={clan.clan_id || clan.short_url || `featured-${index}`}
					clan={clan}
					variant="featured"
					carousel
					priority={index === 0}
					section={section}
					position={index}
					onSelect={onSelect}
				/>
			))}
		</div>
	);
};

export default CommunityCarousel;
