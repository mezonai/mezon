import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getMobileChannelPath } from '../../utils/channelDeeplink';
import { buildAppDeeplink } from '../../utils/deeplink';

export const OpenChannelInAppButton = () => {
	const { pathname } = useLocation();
	const { t } = useTranslation('common');
	const channelPath = getMobileChannelPath(pathname);
	if (!channelPath) return null;

	return (
		<a href={buildAppDeeplink(channelPath)} className="mx-2 shrink-0 rounded bg-[#5865f2] px-3 py-2 text-xs font-semibold text-white">
			{t('invite.openInApp')}
		</a>
	);
};
