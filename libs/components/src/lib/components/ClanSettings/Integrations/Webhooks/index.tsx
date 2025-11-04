import { generateWebhook, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import type { IChannel } from '@mezon/utils';
import { generateE2eId } from '@mezon/utils';
import type { ApiWebhook, ApiWebhookCreateRequest } from 'mezon-js/api.gen';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import WebhookItemModal from './WebhookItemModal';

interface IWebhooksProps {
	allWebhooks?: ApiWebhook[] | undefined;
	currentChannel?: IChannel;
	isClanSetting?: boolean;
}

const Webhooks = ({ allWebhooks, currentChannel, isClanSetting }: IWebhooksProps) => {
	const { t } = useTranslation('integrations');
	const dispatch = useAppDispatch();
	const webhookNames = ['Captain hook', 'Spidey bot', 'Komu Knight'];
	const getRandomWebhookName = (): string => {
		const randomIndex = Math.floor(Math.random() * webhookNames.length);
		return webhookNames[randomIndex];
	};

	const webHookAvatars = [
		`${process.env.NX_BASE_IMG_URL}/1787707828677382144/1791037204600983552/1787691797724532700/211_0mezon_logo_white.png`,
		`${process.env.NX_BASE_IMG_URL}/1787707828677382144/1791037204600983552/1787691797724532700/211_1mezon_logo_black.png`,
		`${process.env.NX_BASE_IMG_URL}/0/1833395573034586112/1787375123666309000/955_0mezon_logo.png`
	];

	const getRandomAvatar = (): string => {
		const randomIndex = Math.floor(Math.random() * webHookAvatars.length);
		return webHookAvatars[randomIndex];
	};
	const clanId = useSelector(selectCurrentClanId) as string;
	const handleAddWebhook = () => {
		const newWebhookReq: ApiWebhookCreateRequest = {
			channel_id: currentChannel?.channel_id as string,
			webhook_name: getRandomWebhookName(),
			avatar: getRandomAvatar(),
			clan_id: clanId
		};
		dispatch(generateWebhook({ request: newWebhookReq, channelId: currentChannel?.channel_id as string, clanId, isClanSetting }));
	};

	return (
		<div className="pb-5">
			<div className=" text-sm pt-5 text-theme-primary">
				{t('webhookDescription')}
				<b className="font-semibold text-[#00a8fc] hover:underline cursor-pointer"> {t('learnMoreWebhook')}</b> {t('orTry')}{' '}
				<b className="font-semibold text-[#00a8fc] hover:underline cursor-pointer">{t('buildWebhook')}</b>
			</div>
			<div className="border-b-theme-primary my-[32px]" />
			{allWebhooks?.length !== 0 ? (
				<>
					<div
						onClick={handleAddWebhook}
						className="py-2 px-4 btn-primary btn-primary-hover  rounded-lg mb-[24px] w-fit text-[14px] font-semibold cursor-pointer "
						data-e2e={generateE2eId('channel_setting_page.webhook.button.new_webhook')}
					>
						{t('newWebhook')}
					</div>
					{allWebhooks &&
						allWebhooks.map((webhook) => (
							<WebhookItemModal isClanSetting={isClanSetting} currentChannel={currentChannel} webhookItem={webhook} key={webhook.id} />
						))}
				</>
			) : (
				<div className="flex items-center flex-col gap-4">
					<Image src={`assets/images/empty-webhook.svg`} width={48} height={48} className="clan object-cover w-[272px]" />
					<div className="font-medium ">{t('noWebhooks')}</div>
					<div
						onClick={handleAddWebhook}
						className="py-2 px-4 btn-primary btn-primary-hover rounded-lg mb-[24px] w-fit text-[14px] font-semibold cursor-pointer"
						data-e2e={generateE2eId('channel_setting_page.webhook.button.new_webhook')}
					>
						{t('newWebhook')}
					</div>
				</div>
			)}
		</div>
	);
};

export default Webhooks;
