import { lazy, Suspense, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HeaderMezon from './components/HeaderMezon';
import { DiscoverProvider } from './context/DiscoverContext';
import { useMezonDiscover } from './hooks/useMezonDiscover';

const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const ClanDetailPage = lazy(() => import('./pages/ClanDetailPage'));

const LoadingSpinner = () => (
	<div className="flex items-center justify-center min-h-screen">
		<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865f2]"></div>
	</div>
);

/**
 */
function AppWithStore() {
	const [sideBarIsOpen, setSideBarIsOpen] = useState(false);

	const toggleSideBar = () => {
		setSideBarIsOpen(!sideBarIsOpen);
	};

	return (
		<div className="min-h-screen bg-[#F4F7F9]">
			<HeaderMezon sideBarIsOpen={sideBarIsOpen} toggleSideBar={toggleSideBar} />

			<div className="pt-[80px]">
				<Suspense fallback={<LoadingSpinner />}>
					<Routes>
						<Route path="/" element={<Navigate to="/clans" replace />} />
						<Route path="/clans" element={<DiscoverPage />} />
						<Route path="/clans/clan/:id" element={<ClanDetailPage />} />
					</Routes>
				</Suspense>
			</div>
		</div>
	);
}

export default function App() {
	const { isLoading, error } = useMezonDiscover();

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return <div className="text-center py-20 text-red-500">{error}</div>;
	}

	return (
		<DiscoverProvider>
			<AppWithStore />
		</DiscoverProvider>
	);
}
