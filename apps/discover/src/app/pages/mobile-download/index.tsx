import { getPlatform } from '@mezon/utils';
import { useEffect } from 'react';

const MobileDownload = () => {
	useEffect(() => {
		const platform = getPlatform();

		if (platform === 'iOS') {
			window.location.href = 'https://apps.apple.com/vn/app/mezon/id6502750046';
		} else if (platform === 'Android') {
			window.location.href = 'https://play.google.com/store/apps/details?id=com.mezon.mobile';
		} else {
			window.location.href = '/';
		}
	}, []);

	return (
		<div className="flex items-center justify-center min-h-screen bg-purple-600">
			<div className="text-center text-white">
				<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
				<p className="text-lg">Redirecting to store...</p>
			</div>
		</div>
	);
};

export default MobileDownload;
