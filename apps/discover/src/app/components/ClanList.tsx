import { ApiClanDiscover } from 'mezon-js/api.gen';
import React from 'react';
import ClanCard from './ClanCard';

/**
 * @param clans
 * @param loading
 */
interface ClanListProps {
	clans: ApiClanDiscover[];
	loading?: boolean;
}

const ClanList: React.FC<ClanListProps> = ({ clans, loading = false }) => {
	if (loading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 5 }).map((_, index) => (
					<div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-gray-200"></div>
							<div className="flex-1">
								<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (clans.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="mb-4 text-gray-400">
					<svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
							clipRule="evenodd"
						></path>
					</svg>
				</div>
				<h3 className="text-xl font-semibold mb-2">No results found</h3>
				<p className="text-gray-600">Please try searching with a different keyword or select another category.</p>
			</div>
		);
	}

	if (!Array.isArray(clans)) {
		return (
			<div className="text-center py-12">
				<div className="mb-4 text-gray-400">
					<svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
							clipRule="evenodd"
						></path>
					</svg>
				</div>
				<h3 className="text-xl font-semibold mb-2">Invalid data</h3>
				<p className="text-gray-600">Invalid format for clan list data.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{clans.map((clan, index) => {
				const clanKey = clan?.clanId || `clan-${Math.random()}`;

				if (!clan || typeof clan !== 'object') {
					return null;
				}

				return <ClanCard key={clanKey} clan={clan} />;
			})}
		</div>
	);
};

export default ClanList;
