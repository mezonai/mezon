import React from 'react';
import CommunityCard, { CommunityCardSkeleton } from './CommunityCard';
import type { DiscoverClan } from './communityUtils';

interface FeaturedBoardProps {
	clans: DiscoverClan[];
	loading?: boolean;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}

const FeaturedBoard: React.FC<FeaturedBoardProps> = ({ clans, loading, onSelect }) => {
	if (loading) {
		return <CommunityCardSkeleton spotlight />;
	}

	if (clans.length === 0) return null;

	if (clans.length === 1) {
		return <CommunityCard clan={clans[0]} variant="spotlight" priority section="featured" position={0} onSelect={onSelect} />;
	}

	if (clans.length === 2) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{clans.map((clan, index) => (
					<CommunityCard
						key={clan.clan_id || clan.short_url}
						clan={clan}
						variant="spotlight"
						priority={index === 0}
						section="featured"
						position={index}
						onSelect={onSelect}
					/>
				))}
			</div>
		);
	}

	const [primary, ...rest] = clans;
	return (
		<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
			<div className="lg:col-span-8">
				<CommunityCard clan={primary} variant="spotlight" priority section="featured" position={0} onSelect={onSelect} />
			</div>
			<div className="lg:col-span-4 flex flex-col gap-4">
				{rest.slice(0, 2).map((clan, index) => (
					<CommunityCard
						key={clan.clan_id || clan.short_url}
						clan={clan}
						variant="default"
						section="featured"
						position={index + 1}
						onSelect={onSelect}
					/>
				))}
			</div>
		</div>
	);
};

export default FeaturedBoard;
