import { restoreLocalStorage } from '@mezon/store';
import { Image } from '@mezon/ui';
import isElectron from 'is-electron';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';

const ErrorRoutes = () => {
	const { t } = useTranslation('common');
	const error = useRouteError();
	const [isOffline, setIsOffline] = useState(!navigator.onLine);
	const [retrying, setRetrying] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	console.error(error);

	useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	const navigateReload = useCallback(() => {
		restoreLocalStorage([
			'persist:auth',
			'mezon_session',
			'mezon_refresh_session',
			'persist:apps',
			'persist:categories',
			'persist:clans',
			'hideNotificationContent',
			'current-theme',
			'remember_channel',
			'i18nextLng',
			'persist:wallet'
		]);

		if (isElectron()) {
			window.location.href = window.location.pathname;
		} else {
			window.location.href = '/chat/direct/friends';
		}
	}, []);

	const checkConnection = useCallback((): Promise<boolean> => {
		return fetch(`${window.origin}/assets/favicon.ico`, {
			method: 'HEAD',
			cache: 'no-cache',
			signal: AbortSignal.timeout(5000)
		})
			.then((res) => res.ok)
			.catch(() => false);
	}, []);

	const showToast = useCallback((message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(''), 3000);
	}, []);

	const handleClick = useCallback(() => {
		if (!navigator.onLine) {
			setIsOffline(true);
			showToast(t('errorBoundary.stillOffline', 'No internet connection. Please check your network.'));
			return;
		}

		setRetrying(true);
		checkConnection().then((online) => {
			if (online) {
				navigateReload();
			} else {
				setRetrying(false);
				setIsOffline(true);
				showToast(t('errorBoundary.connectionFailed', 'Connection failed. Please try again.'));
			}
		});
	}, [navigateReload, checkConnection, showToast, t]);

	return (
		<div
			id="error-crash"
			style={{ backgroundImage: `url(assets/images/bg-boundary.svg)` }}
			className="flex flex-col items-center justify-center min-h-screen bg-gray-500 text-gray-300 p-4 error-boundary"
		>
			<div className="max-w-md w-full text-center">
				<div className="flex justify-center">
					<Image src={`assets/images/error-boundary.svg`} />
				</div>
				<h2 className="mt-6 text-2xl leading-[8px] mb-4 font-semibold text-center text-white leading-none">
					{isOffline ? t('errorBoundary.networkError', 'Network Error') : t('errorBoundary.title')}
				</h2>
				<p className="m-3.5 text-base leading-none">
					{isOffline
						? t('errorBoundary.offlineMessage', 'Unable to connect. Please check your internet connection and try again.')
						: t('errorBoundary.crashMessage')}
				</p>
				{!isOffline && <p className="m-3.5 text-base leading-none">{t('errorBoundary.trackedMessage')}</p>}
				<div className="mt-6">
					<button
						className="bg-[#5864f2] hover:bg-indigo-600 disabled:bg-[#3b3d5c] disabled:cursor-not-allowed text-white font-medium w-[130px] h-[44px] px-4 rounded text-sm"
						onClick={handleClick}
						disabled={retrying}
					>
						{retrying ? t('errorBoundary.connecting', 'Connecting...') : t('errorBoundary.reload')}
					</button>
				</div>
			</div>
			{toastMessage && (
				<div className="fixed top-4 right-4 z-[9999] animate-[slideIn_0.3s_ease-out]">
					<div className="bg-[#313338] text-[#f23f43] border border-[#1e1f22] rounded-lg px-4 py-3 shadow-lg text-sm font-medium">
						{toastMessage}
					</div>
				</div>
			)}
		</div>
	);
};

export default ErrorRoutes;
