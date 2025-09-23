import { Icons } from '@mezon/ui';
import type { ApiWebhook } from 'mezon-js/api.gen';
import { useTranslation } from 'react-i18next';

interface IIntegrationProps {
	setIsOpenWebhooks(): void;
	allWebhooks?: ApiWebhook[] | undefined;
}

const MainIntegrations = ({ setIsOpenWebhooks, allWebhooks }: IIntegrationProps) => {
	const { t } = useTranslation('integrations');
	return (
		<>
			<div className="text-sm pt-5 text-theme-primary">
				{t('description')} <b className="font-semibold text-[#00a8fc] hover:underline cursor-pointer">{t('learnMore')}</b>
			</div>
			<div className="border-b-theme-primary my-[32px]" />
			<div
				onClick={() => {
					if (allWebhooks && allWebhooks?.length !== 0) {
						setIsOpenWebhooks();
					}
				}}
				className={`py-[20px] px-[16px] flex justify-between items-center border-theme-primary rounded-lg bg-item-theme ${allWebhooks?.length !== 0 ? 'cursor-pointer' : ''}`}
			>
				<div className="flex gap-4 max-sm:gap-0 max-sbm:w-[40%] items-center">
					<Icons.WebhooksIcon />
					<div>
						<div className="pb-[3px] font-semibold break-all text-theme-primary">{t('webhooks')}</div>
						<div className="text-[12px] text-theme-primary">
							{allWebhooks?.length ? t('webhook_other', { count: allWebhooks?.length }) : t('webhookCount', { count: 0 })}
						</div>
					</div>
				</div>
				{allWebhooks && allWebhooks?.length === 0 ? (
					<div
						onClick={setIsOpenWebhooks}
						className="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md py-2 px-3 cursor-pointer font-semibold"
					>
						{t('createWebhook')}
					</div>
				) : (
					<div className="items-center cursor-pointer text-[14px] flex gap-[4px]">
						<div className="text-theme-primary">{t('viewWebhook')}</div>
						<Icons.ArrowDown defaultSize="h-[15px] w-[15px]  -rotate-90" />
					</div>
				)}
			</div>
		</>
	);
};

export default MainIntegrations;
