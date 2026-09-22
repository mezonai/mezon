import React from 'react';
import CommunityCard, { CommunityCardSkeleton, type CommunityCardVariant } from './CommunityCard';
import type { DiscoverClan } from './communityUtils';

interface CommunityGridProps {
	clans: DiscoverClan[];
	loading?: boolean;
	variant?: CommunityCardVariant;
	skeletonCount?: number;
	section?: string;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}

const CommunityGrid: React.FC<CommunityGridProps> = ({ clans, loading = false, variant = 'default', skeletonCount = 6, section, onSelect }) => {
	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
				{Array.from({ length: skeletonCount }).map((_, index) => (
					<CommunityCardSkeleton key={`skeleton-${index}`} />
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
			{clans.map((clan, index) => (
				<CommunityCard
					key={clan.clan_id || clan.short_url || `clan-${index}`}
					clan={clan}
					variant={variant}
					priority={section === 'featured' && index === 0}
					section={section}
					position={index}
					onSelect={onSelect}
				/>
			))}
		</div>
	);
};

export default CommunityGrid;
