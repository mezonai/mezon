import i18n from '@mezon/translations';
import { lazy, Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from './components/common/ScrollToTop';
import { DiscoverProvider } from './context/DiscoverContext';
import { useDiscoverAnalytics } from './hooks/useDiscoverAnalytics';
import { useMezonDiscover } from './hooks/useMezonDiscover';
import AboutMezon from './pages/aboutmezon';
import AiAgentPage from './pages/aiagent';
import AIGenerationPage from './pages/aigeneration';
import AppDirectory from './pages/AppDirectory';
import BrandCenterPage from './pages/brandcenter';
import ClanWorld from './pages/clandetail';
import ContactUsPage from './pages/contactus';
import CustomizePage from './pages/customize';
import ClanDetailPage from './pages/dicoverpage/ClanDetailPage';
import IntegrationsPage from './pages/integrations';
import MezonDongPage from './pages/mezondong';
import MezonPage from './pages/mezonpage';
import MobileDownload from './pages/mobile-download';
import OrganizePage from './pages/organize';
import PrivacyMezonPage from './pages/privacymezon';
import TermOfServivePage from './pages/termofservices';
import TextChannelPage from './pages/textchannel';

const DiscoverPage = lazy(() => import('./pages/dicoverpage/DiscoverPage'));

const LoadingSpinner = () => (
	<div className="flex items-center justify-center min-h-screen">
		<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-brand-primary)]"></div>
	</div>
);

function AppWithStore() {
	useDiscoverAnalytics();

	return (
		<div className="min-h-screen bg-[var(--surface-page)]">
			<ScrollToTop />
			<ToastContainer position="bottom-center" autoClose={2000} hideProgressBar />
			<Suspense fallback={<LoadingSpinner />}>
				<Routes>
					<Route path="/" element={<MezonPage />} />
					<Route path="/clans" element={<DiscoverPage />} />
					<Route path="/clans/clan/:id" element={<ClanDetailPage />} />
					<Route path="/clans/:id" element={<ClanDetailPage />} />
					<Route path="/about" element={<AboutMezon />} />
					<Route path="/contact-us" element={<ContactUsPage />} />
					<Route path="/terms-of-service" element={<TermOfServivePage />} />
					<Route path="/integrations" element={<IntegrationsPage />} />
					<Route path="/clanworld" element={<ClanWorld />} />
					<Route path="/organize" element={<OrganizePage />} />
					<Route path="/customize" element={<CustomizePage />} />
					<Route path="/aigeneration" element={<AIGenerationPage />} />
					<Route path="/mobile-download" element={<MobileDownload />} />
					<Route path="/apps" element={<AppDirectory />} />
					<Route path="/fastmessage" element={<TextChannelPage />} />
					<Route path="/privacy-policy" element={<PrivacyMezonPage />} />
					<Route path="/brand-center" element={<BrandCenterPage />} />
					<Route path="/mezondong" element={<MezonDongPage />} />
					<Route path="/aiagent" element={<AiAgentPage />} />
				</Routes>
			</Suspense>
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
		<I18nextProvider i18n={i18n}>
			<DiscoverProvider>
				<AppWithStore />
			</DiscoverProvider>
		</I18nextProvider>
	);
}
