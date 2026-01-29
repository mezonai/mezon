import { useState } from 'react';
import ClanDetailReport from './ClanDetailReport';
import ClanUsageReport from './ClanUsageReport';

/**
 * Main Dashboard component that handles routing between two views:
 * 1. ClanUsageReport - Overview of all clans (default view)
 * 2. ClanDetailReport - Detailed clan report when a clan is selected
 */
function DashboardPage() {
	const [currentView, setCurrentView] = useState<'overview' | 'detail'>('overview');
	const [selectedClan, setSelectedClan] = useState<string | null>(null);

	const handleClanClick = (clanId: string) => {
		setSelectedClan(clanId);
		setCurrentView('detail');
	};

	const handleBackToOverview = () => {
		setCurrentView('overview');
		setSelectedClan(null);
	};

	return (
		<div>
			{currentView === 'overview' ? (
				<ClanUsageReport onClanClick={handleClanClick} />
			) : (
				<div>
					{/* Back button */}
					<div className="mb-4">
						<button
							onClick={handleBackToOverview}
							className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							Back to Clan Usage Overview
						</button>
					</div>
					{selectedClan && <ClanDetailReport clanId={selectedClan} />}
				</div>
			)}
		</div>
	);
}

export default DashboardPage;
