import { getPlatform } from '@mezon/utils';
import { useEffect } from 'react';

export default function MobileDownload() {
	useEffect(() => {
		const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent || '' : '';
		const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
		const isAndroid = /Android/i.test(userAgent);

		if (isIOS) {
			window.location.href = 'https://apps.apple.com/vn/app/mezon/id6502750046';
		} else if (isAndroid) {
			window.location.href = 'https://play.google.com/store/apps/details?id=com.mezon.mobile';
		} else {
			const platform = getPlatform();
			if (platform === 'iOS') {
				window.location.href = 'https://apps.apple.com/vn/app/mezon/id6502750046';
			} else if (platform === 'Android') {
				window.location.href = 'https://play.google.com/store/apps/details?id=com.mezon.mobile';
			} else {
				window.location.href = 'https://apps.apple.com/vn/app/mezon/id6502750046';
			}
		}
	}, []);

	return (
		<div className="flex items-center justify-center min-h-screen bg-[#0B0E2D] text-white">
			<div className="text-center">
				<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
				<p className="text-lg font-medium">Redirecting to store...</p>
			</div>
		</div>
	);
}
