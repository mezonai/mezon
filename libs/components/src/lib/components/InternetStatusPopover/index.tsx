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
						<svg
							className="w-6 h-6 text-red-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M1 1l22 22M1.42 9.42c5.857-5.857 15.355-5.857 21.213 0M5.929 13.929a9.969 9.969 0 0112.142 0M10.586 18.586a2 2 0 012.828 0"
							/>
						</svg>
					) : (
						<svg
							className="w-6 h-6 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
							/>
						</svg>
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
						<svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
};

export default InternetStatusPopover;
