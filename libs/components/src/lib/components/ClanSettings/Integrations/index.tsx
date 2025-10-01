import { selectAllClanWebhooks, selectWebhooksByChannelId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ClanWebhooks from './ClanWebhooks';
import MainClanIntegrations from './MainClanIntegration';
import MainIntegrations from './MainIntegrations';
import Webhooks from './Webhooks';

interface IIntegrationsProps {
	currentChannel?: IChannel;
	isClanSetting?: boolean;
}

const Integrations = ({ currentChannel, isClanSetting }: IIntegrationsProps) => {
	const { t } = useTranslation('integrations');
	const [isOpenWebhooks, setIsOpenWebhooks] = useState(false);
	const [isOpenClanWebhooks, setIsOpenClanWebhooks] = useState(false);
	const allWebhooks = useAppSelector((state) =>
		selectWebhooksByChannelId(state, isClanSetting ? '0' : (currentChannel?.channel_id ?? ''), currentChannel?.clan_id ?? '')
	);
	const allClanWebhooks = useSelector(selectAllClanWebhooks);
	return (
		<div className="mt-[60px]">
			<h2 className="text-xl font-semibold mb-5 flex text-theme-primary-active">
				<div
					onClick={() => {
						setIsOpenWebhooks(false);
						setIsOpenClanWebhooks(false);
					}}
					className={`${isOpenWebhooks || isOpenClanWebhooks ? ' cursor-pointer' : ''}`}
				>
					{t('title')}
				</div>{' '}
				{isOpenClanWebhooks ? (
					<div className="flex">
						<Icons.ArrowDown defaultSize="-rotate-90 w-[20px]" />
						{t('clanWebhooks')}
					</div>
				) : isOpenWebhooks ? (
					<div className="flex">
						<Icons.ArrowDown defaultSize="-rotate-90 w-[20px]" />
						{t('webhooks')}
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
