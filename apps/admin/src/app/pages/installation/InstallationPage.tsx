import copy from 'copy-to-clipboard';
import { useMatches } from 'react-router-dom';

const Installation = () => {
	const matches = useMatches();
	const appMatch = matches.find((match) => match.pathname.includes('/developers/applications/'));

	const application = (appMatch?.data as any)?.application;

	if (!application) {
		return <div className="text-red-500">Application data not found</div>;
	}

	const linkInstall = window.location.origin + (application.appUrl ? '/developers/app/install/' : '/developers/bot/install/') + application.id;

	const handleCopyToClipboard = () => {
		copy(linkInstall);
	};

	return (
		<div className="text-xl">
			<h3 className="text-2xl font-semibold mb-4">Installation</h3>
			<p className="dark:text-contentTertiary text-colorTextLightMode mb-8">{linkInstall}</p>
		</div>
	);
};

export default Installation;
