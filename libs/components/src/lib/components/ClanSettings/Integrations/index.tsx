import { selectAllClanWebhooks, selectCurrentChannel, selectWebhooksByChannelId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ClanWebhooks from './ClanWebhooks';
import MainClanIntegrations from './MainClanIntegration';
import MainIntegrations from './MainIntegrations';
import Webhooks from './Webhooks';

interface IIntegrationsProps {
	isClanSetting?: boolean;
}

const Integrations = ({ isClanSetting }: IIntegrationsProps) => {
	const { t } = useTranslation('integrations');
	const [isOpenWebhooks, setIsOpenWebhooks] = useState(false);
	const [isOpenClanWebhooks, setIsOpenClanWebhooks] = useState(false);
	const currentChannel = useSelector(selectCurrentChannel) || undefined;

	const allWebhooks = useAppSelector((state) =>
		selectWebhooksByChannelId(state, isClanSetting ? '0' : (currentChannel?.channel_id ?? ''), currentChannel?.clan_id ?? '')
	);
	const allClanWebhooks = useSelector(selectAllClanWebhooks);

	return (
		<div className={isClanSetting ? 'clan-integrations' : 'channel-integrations'}>
			<h2
				className={`text-xl max-sm:text-lg font-semibold mb-5 text-theme-primary-active flex flex-wrap items-center gap-2 max-sm:gap-1 ${isClanSetting ? 'sbm:mt-[60px] mt-[10px]' : ''}`}
			>
				<div
					onClick={() => {
						setIsOpenWebhooks(false);
						setIsOpenClanWebhooks(false);
					}}
					className={`${isOpenWebhooks || isOpenClanWebhooks ? ' cursor-pointer' : ''}`}
				>
					{t('title')}
				</div>
				{isOpenClanWebhooks ? (
					<div className="flex items-center gap-1 max-sm:gap-0.5">
						<Icons.ArrowDown defaultSize="-rotate-90 w-[20px] max-sm:w-[16px]" />
						<span className="max-sm:text-base">{t('clanWebhooks')}</span>
					</div>
				) : isOpenWebhooks ? (
					<div className="flex items-center mt-1 gap-1 max-sm:gap-0.5">
						<Icons.ArrowDown defaultSize="-rotate-90 w-[20px] max-sm:w-[16px]" />
						<span className="max-sm:text-base">{t('webhooks')}</span>
					</div>
				) : (
					''
				)}
			</h2>

			{isOpenWebhooks ? (
				<Webhooks isClanSetting={isClanSetting} allWebhooks={allWebhooks} currentChannel={currentChannel} />
			) : isOpenClanWebhooks ? (
				<ClanWebhooks allClanWebhooks={allClanWebhooks} />
			) : (
				<div>
					{currentChannel && <MainIntegrations allWebhooks={allWebhooks} setIsOpenWebhooks={() => setIsOpenWebhooks(true)} />}
					{isClanSetting && (
						<MainClanIntegrations allClanWebhooks={allClanWebhooks} setIsOpenClanWebhooks={() => setIsOpenClanWebhooks(true)} />
					)}
				</div>
			)}
		</div>
	);
};

export default Integrations;
