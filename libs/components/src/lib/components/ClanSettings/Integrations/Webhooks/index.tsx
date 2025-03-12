import { generateWebhook, selectCurrentClanId, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import { IChannel } from '@mezon/utils';
import { ApiWebhook, ApiWebhookCreateRequest } from 'mezon-js/api.gen';
import { useSelector } from 'react-redux';
import WebhookItemModal from './WebhookItemModal';

interface IWebhooksProps {
	allWebhooks?: ApiWebhook[] | undefined;
	currentChannel?: IChannel;
	isClanSetting?: boolean;
}

const Webhooks = ({ allWebhooks, currentChannel, isClanSetting }: IWebhooksProps) => {
	const dispatch = useAppDispatch();
	const webhookNames = ['Captain hook', 'Spidey bot', 'Komu Knight'];
	const getRandomWebhookName = (): string => {
		const randomIndex = Math.floor(Math.random() * webhookNames.length);
		return webhookNames[randomIndex];
	};

	const webHookAvatars = [
		'https://cdn.mezon.vn/1787707828677382144/1791037204600983552/1787691797724532700/211_0mezon_logo_white.png',
		'https://cdn.mezon.vn/1787707828677382144/1791037204600983552/1787691797724532700/211_1mezon_logo_black.png',
		'https://cdn.mezon.vn/0/1833395573034586112/1787375123666309000/955_0mezon_logo.png'
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
		dispatch(
			generateWebhook({ request: newWebhookReq, channelId: currentChannel?.channel_id as string, clanId: clanId, isClanSetting: isClanSetting })
		);
	};

	return (
		<div className="pb-5">
			<div className="dark:text-[#b5bac1] text-textLightTheme text-sm pt-5">
				Webhooks are a simple way to post messages from other apps and websites into Mezon using internet magic.
				<b className="font-semibold text-[#00a8fc] hover:underline cursor-pointer"> Learn more</b> or try{' '}
				<b className="font-semibold text-[#00a8fc] hover:underline cursor-pointer">building one yourself.</b>
			</div>
			<div className="border-b-[1px] dark:border-[#616161] my-[32px]" />
			{allWebhooks?.length !== 0 ? (
				<>
					<div
						onClick={handleAddWebhook}
						className="py-2 px-4 bg-[#5865f2] rounded-sm mb-[24px] w-fit text-[14px] font-semibold cursor-pointer"
					>
						New Webhook
					</div>
					{allWebhooks &&
						allWebhooks.map((webhook) => (
							<WebhookItemModal isClanSetting={isClanSetting} currentChannel={currentChannel} webhookItem={webhook} key={webhook.id} />
						))}
				</>
			) : (
				<div className="flex items-center flex-col gap-4">
					<Image src={`assets/images/empty-webhook.svg`} width={48} height={48} className="clan object-cover w-[272px]" />
					<div className="font-medium dark:text-[#b5bac1] text-textLightTheme">You have no webhooks!</div>
					<div
						onClick={handleAddWebhook}
						className="py-2 px-4 bg-[#5865f2] rounded-sm mb-[24px] w-fit text-[14px] font-semibold cursor-pointer"
					>
						New Webhook
					</div>
				</div>
			)}
		</div>
	);
};

export default Webhooks;
