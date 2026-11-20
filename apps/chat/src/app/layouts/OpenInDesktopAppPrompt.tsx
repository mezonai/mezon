import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { IS_LINUX, IS_MAC_OS, IS_WINDOWS } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const DESKTOP_APP_SCHEME = 'mezonapp://';

const INVITE_PATH = /^\/invite\/[\w-]+$/;

const SIGN_IN_PATH = '/mezon';

const desktopAppLinkFor = (pathname: string): string | null => {
	const path = pathname.replace(/\/+$/, '');
	if (!INVITE_PATH.test(path)) {
		return null;
	}
	return `${DESKTOP_APP_SCHEME}${path.slice(1)}`;
};

const readLandingDesktopAppLink = (): string | null => {
	if (!(IS_MAC_OS || IS_WINDOWS || IS_LINUX)) {
		return null;
	}
	const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	if (!navigation || navigation.type !== 'navigate') {
		return null;
	}
	try {
		return desktopAppLinkFor(new URL(navigation.name).pathname);
	} catch {
		return null;
	}
};

export const landingDesktopAppLink = readLandingDesktopAppLink();

const openDesktopApp = (link: string) => {
	window.location.href = link;
};

const OpenInDesktopAppPrompt = () => {
	const { t } = useTranslation('common');
	const { pathname } = useLocation();
	const [link, setLink] = useState(landingDesktopAppLink);

	if (!link || pathname === SIGN_IN_PATH) {
		return null;
	}

	const openInApp = () => {
		openDesktopApp(link);
		setLink(null);
	};

	return (
		<div className="fixed z-50 top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 pl-4 pr-2 py-2 rounded-lg shadow-xl bg-theme-setting-primary border-theme-primary text-theme-primary">
			<span className="text-sm font-medium whitespace-nowrap">{t('openInDesktopApp.title')}</span>
			<button
				onClick={openInApp}
				className="text-white text-sm font-medium px-3 py-1 rounded-md btn-primary btn-primary-hover whitespace-nowrap"
			>
				{t('openInDesktopApp.open')}
			</button>
			<button onClick={() => setLink(null)} aria-label={t('openInDesktopApp.dismiss')} className="p-1 rounded-md bg-item-theme-hover">
				<MezonIcon icon={MzIcons16.mzClose} />
			</button>
		</div>
	);
};

export const OpenInDesktopAppPage = ({ link, onContinueInBrowser }: { link: string; onContinueInBrowser: () => void }) => {
	const { t } = useTranslation('common');

	return (
		<div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-theme-primary">
			<div className="bg-theme-setting-primary border-theme-primary text-theme-primary rounded-md p-6 w-full max-w-[440px] flex flex-col items-center shadow-xl">
				<div className="flex items-center justify-center mb-4 w-12 h-12 rounded-md bg-gray-700">
					<img src="/assets/images/mezon-logo-white.svg" alt="Mezon" className="w-7 h-7" />
				</div>
				<p className="text-center text-base mb-5">{t('openInDesktopApp.title')}</p>
				<button
					onClick={() => openDesktopApp(link)}
					className="text-white w-full py-[10px] text-base font-medium rounded-md btn-primary btn-primary-hover"
				>
					{t('openInDesktopApp.open')}
				</button>
				<button onClick={onContinueInBrowser} className="w-full mt-3 py-[10px] text-sm font-medium rounded-md bg-item-theme-hover">
					{t('openInDesktopApp.continueInBrowser')}
				</button>
			</div>
		</div>
	);
};

export default OpenInDesktopAppPrompt;
