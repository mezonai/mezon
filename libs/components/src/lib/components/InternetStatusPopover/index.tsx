import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const InternetStatusPopover: React.FC = () => {
	const { isOnline, isOffline } = useNetworkStatus();
	const [showPopover, setShowPopover] = useState(false);
	const [animateOut, setAnimateOut] = useState(false);

	useEffect(() => {
		if (isOffline) {
			setShowPopover(true);
			setAnimateOut(false);
		} else if (isOnline && showPopover) {
			setAnimateOut(false);
			const timer = setTimeout(() => {
				setAnimateOut(true);
				const hideTimer = setTimeout(() => {
					setShowPopover(false);
					setAnimateOut(false);
				}, 300);
				return () => clearTimeout(hideTimer);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [isOnline, isOffline, showPopover]);

	const handleClose = () => {
		setAnimateOut(true);
		setTimeout(() => {
			setShowPopover(false);
			setAnimateOut(false);
		}, 300);
	};

	const handleRefresh = () => {
		window.location.reload();
	};

	if (!showPopover) {
		return null;
	}

	return (
		<div
			className={`fixed bottom-6 left-6 z-50 transition-all duration-300 ease-in-out transform ${
				animateOut ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
			}`}
		>
			<div className="flex items-center gap-3 px-4 py-3 bg-theme-contexify rounded-2xl shadow-lg border-theme-primary min-w-[300px]">
				<div className="flex-shrink-0">
					{isOffline ? (
						<MezonIcon icon={MzIcons24.mzWifiOff} className="text-red-500" />
					) : (
						<MezonIcon icon={MzIcons24.mzWifi} className="text-green-500" />
					)}
				</div>

				<div className="flex-1 min-w-0 ">
					<p className="text-sm font-medium text-[var(--text-theme-primary)]">
						{isOffline ? 'You are currently offline.' : 'Your internet connection was restored.'}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{isOffline && (
						<button
							onClick={handleRefresh}
							className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
						>
							Refresh
						</button>
					)}

					<button onClick={handleClose} className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors">
						<MezonIcon icon={MzIcons20.mzClose} className="text-[var(--mz-icon)]" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default InternetStatusPopover;
