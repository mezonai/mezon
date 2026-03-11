import { ToastController } from '@mezon/components';
import { MezonUiProvider } from '@mezon/ui';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AppearanceProvider } from '../context/AppearanceContext';

const LoadingFallback = () => {
	return (
		<div className="fixed inset-0 bg-[#313337] flex justify-center items-center z-[9999]">
			<div className="relative">
				<div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
			</div>
		</div>
	);
};

const AppLayout = () => {
	return (
		<MezonUiProvider>
			<AppearanceProvider>
				<div id="app-layout">
					<ToastController />
					<Suspense fallback={<LoadingFallback />}>
						<Outlet />
					</Suspense>
				</div>
			</AppearanceProvider>
		</MezonUiProvider>
	);
};

export default AppLayout;
